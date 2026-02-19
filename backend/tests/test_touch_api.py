"""
Backend API Tests for Touch CRM
Tests: health, seed, contacts CRUD, interactions, dashboard, settings, goals
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestHealthAndSeed:
    """Health check and seed data tests"""
    
    def test_api_root(self, api_client):
        """Test GET /api/ returns running message"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Touch API" in data["message"]
        print(f"✓ API root health check passed: {data}")

    def test_seed_data(self, api_client):
        """Test POST /api/seed creates sample contacts"""
        response = api_client.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Seed data: {data}")


class TestContactsCRUD:
    """Contact CRUD operations"""
    
    def test_get_contacts_list(self, api_client):
        """Test GET /api/contacts returns list"""
        response = api_client.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)
        assert len(contacts) > 0  # Should have seeded data
        
        # Validate structure
        first = contacts[0]
        assert "id" in first
        assert "name" in first
        assert "relationship_tag" in first
        assert "connection_health" in first
        print(f"✓ Got {len(contacts)} contacts")

    def test_create_contact_and_verify(self, api_client):
        """Test POST /api/contacts and verify with GET"""
        create_payload = {
            "name": "TEST_Alice Johnson",
            "phone": "+1555123456",
            "email": "test_alice@example.com",
            "relationship_tag": "Friend",
            "frequency_days": 7,
            "notes": "Met at conference"
        }
        
        # Create contact
        create_response = api_client.post(
            f"{BASE_URL}/api/contacts",
            json=create_payload
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert created["name"] == create_payload["name"]
        assert created["email"] == create_payload["email"]
        assert "id" in created
        contact_id = created["id"]
        print(f"✓ Created contact: {contact_id}")
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/contacts/{contact_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["id"] == contact_id
        assert fetched["name"] == create_payload["name"]
        assert fetched["email"] == create_payload["email"]
        print(f"✓ Contact persisted correctly")
        
        return contact_id

    def test_get_single_contact(self, api_client):
        """Test GET /api/contacts/{id}"""
        # Get any contact from list
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        assert len(contacts) > 0
        
        contact_id = contacts[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/contacts/{contact_id}")
        assert response.status_code == 200
        contact = response.json()
        assert contact["id"] == contact_id
        assert "name" in contact
        assert "connection_health" in contact
        print(f"✓ Got contact {contact['name']}")

    def test_update_contact_and_verify(self, api_client):
        """Test PUT /api/contacts/{id} and verify changes"""
        # Get a contact
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_id = contacts[0]["id"]
        
        update_payload = {
            "notes": "Updated notes test",
            "is_pinned": True
        }
        
        # Update
        update_response = api_client.put(
            f"{BASE_URL}/api/contacts/{contact_id}",
            json=update_payload
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["notes"] == update_payload["notes"]
        assert updated["is_pinned"] == True
        print(f"✓ Updated contact {contact_id}")
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/contacts/{contact_id}")
        fetched = get_response.json()
        assert fetched["notes"] == update_payload["notes"]
        assert fetched["is_pinned"] == True
        print(f"✓ Update persisted correctly")

    def test_delete_contact_and_verify(self, api_client):
        """Test DELETE /api/contacts/{id} and verify removal"""
        # Create a test contact
        create_payload = {"name": "TEST_DeleteMe", "relationship_tag": "Other"}
        created = api_client.post(f"{BASE_URL}/api/contacts", json=create_payload).json()
        contact_id = created["id"]
        print(f"✓ Created test contact for deletion: {contact_id}")
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/contacts/{contact_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted contact")
        
        # Verify 404 on GET
        get_response = api_client.get(f"{BASE_URL}/api/contacts/{contact_id}")
        assert get_response.status_code == 404
        print(f"✓ Contact correctly removed (404)")


class TestInteractions:
    """Interaction logging and retrieval with AI"""
    
    def test_create_interaction_with_ai_summary(self, api_client):
        """Test POST /api/interactions creates interaction with AI summary"""
        # Get a contact
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_id = contacts[0]["id"]
        
        interaction_payload = {
            "contact_id": contact_id,
            "interaction_type": "call",
            "notes": "Had a wonderful conversation about their new job at Google. They are really excited about the team and mentioned they want to visit us next month. Also discussed their dog Max who is recovering well from surgery.",
            "duration_minutes": 25
        }
        
        # Create interaction (AI takes time)
        create_response = api_client.post(
            f"{BASE_URL}/api/interactions",
            json=interaction_payload
        )
        assert create_response.status_code == 200
        interaction = create_response.json()
        assert interaction["contact_id"] == contact_id
        assert "id" in interaction
        assert "ai_summary" in interaction
        assert "key_highlights" in interaction
        
        # AI should have generated summary (may be empty if AI failed, but keys should exist)
        print(f"✓ Created interaction with AI summary")
        print(f"  AI Summary: {interaction.get('ai_summary', 'None')[:100]}")
        print(f"  Highlights: {interaction.get('key_highlights', [])}")
        
        return interaction["id"], contact_id

    def test_get_interactions_for_contact(self, api_client):
        """Test GET /api/interactions/{contact_id}"""
        # Get a contact
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_id = contacts[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/interactions/{contact_id}")
        assert response.status_code == 200
        interactions = response.json()
        assert isinstance(interactions, list)
        # May be empty if no interactions yet
        print(f"✓ Got {len(interactions)} interactions for contact")


class TestDashboard:
    """Dashboard data aggregation"""
    
    def test_get_dashboard_data(self, api_client):
        """Test GET /api/dashboard returns aggregated data"""
        response = api_client.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        dashboard = response.json()
        
        # Validate structure
        assert "overall_score" in dashboard
        assert "total_contacts" in dashboard
        assert "needs_attention" in dashboard
        assert "weekly_interactions" in dashboard
        assert "monthly_interactions" in dashboard
        assert "category_breakdown" in dashboard
        
        # Validate data types
        assert isinstance(dashboard["overall_score"], (int, float))
        assert isinstance(dashboard["total_contacts"], int)
        assert isinstance(dashboard["needs_attention"], list)
        
        print(f"✓ Dashboard data:")
        print(f"  Overall score: {dashboard['overall_score']}%")
        print(f"  Total contacts: {dashboard['total_contacts']}")
        print(f"  Needs attention: {len(dashboard['needs_attention'])}")
        print(f"  Weekly interactions: {dashboard['weekly_interactions']}")


class TestSettings:
    """Settings management"""
    
    def test_get_settings(self, api_client):
        """Test GET /api/settings returns settings"""
        response = api_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        settings = response.json()
        
        assert "notification_intensity" in settings
        assert "low_pressure_mode" in settings
        assert "theme_mode" in settings
        assert "onboarding_completed" in settings
        
        print(f"✓ Got settings: {settings}")

    def test_update_settings_and_verify(self, api_client):
        """Test PUT /api/settings and verify changes"""
        update_payload = {
            "notification_intensity": 75,
            "low_pressure_mode": True
        }
        
        # Update
        update_response = api_client.put(
            f"{BASE_URL}/api/settings",
            json=update_payload
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["notification_intensity"] == 75
        assert updated["low_pressure_mode"] == True
        print(f"✓ Updated settings")
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/settings")
        fetched = get_response.json()
        assert fetched["notification_intensity"] == 75
        assert fetched["low_pressure_mode"] == True
        print(f"✓ Settings update persisted")


class TestGoals:
    """Goals CRUD operations"""
    
    def test_create_goal_and_verify(self, api_client):
        """Test POST /api/goals and verify with GET"""
        goal_payload = {
            "title": "TEST_Reconnect with old friends",
            "description": "Reach out to 5 friends from college",
            "target_contact_ids": [],
            "target_date": "2026-03-01T00:00:00Z"
        }
        
        # Create
        create_response = api_client.post(
            f"{BASE_URL}/api/goals",
            json=goal_payload
        )
        assert create_response.status_code == 200
        goal = create_response.json()
        assert goal["title"] == goal_payload["title"]
        assert "id" in goal
        assert goal["status"] == "active"
        goal_id = goal["id"]
        print(f"✓ Created goal: {goal_id}")
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/goals")
        goals = get_response.json()
        assert any(g["id"] == goal_id for g in goals)
        print(f"✓ Goal persisted")
        
        return goal_id

    def test_get_goals(self, api_client):
        """Test GET /api/goals returns list"""
        response = api_client.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 200
        goals = response.json()
        assert isinstance(goals, list)
        print(f"✓ Got {len(goals)} goals")


class TestAIFeatures:
    """AI-powered features (may be slower)"""
    
    def test_get_call_prep(self, api_client):
        """Test GET /api/ai/call-prep/{contact_id}"""
        # Get a contact
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_id = contacts[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/ai/call-prep/{contact_id}")
        assert response.status_code == 200
        prep = response.json()
        
        assert "contact_name" in prep
        assert "recap" in prep
        assert "follow_ups" in prep
        assert "conversation_starters" in prep
        
        print(f"✓ Call prep for {prep['contact_name']}")
        print(f"  Recap: {prep['recap'][:100] if prep['recap'] else 'None'}")

    def test_get_insights(self, api_client):
        """Test GET /api/ai/insights"""
        response = api_client.get(f"{BASE_URL}/api/ai/insights")
        assert response.status_code == 200
        insights = response.json()
        
        assert "overall_insight" in insights
        assert "drift_alerts" in insights
        assert "suggestions" in insights
        assert "encouragement" in insights
        
        print(f"✓ AI Insights:")
        print(f"  Overall: {insights['overall_insight'][:100] if insights['overall_insight'] else 'None'}")

    def test_get_conversation_prompts(self, api_client):
        """Test GET /api/ai/prompts/{contact_id}"""
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_id = contacts[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/ai/prompts/{contact_id}?mode=deep")
        assert response.status_code == 200
        result = response.json()
        
        assert "prompts" in result
        assert isinstance(result["prompts"], list)
        print(f"✓ Got {len(result['prompts'])} conversation prompts")


class TestDataManagement:
    """Data export and deletion"""
    
    def test_export_data(self, api_client):
        """Test GET /api/data/export"""
        response = api_client.get(f"{BASE_URL}/api/data/export")
        assert response.status_code == 200
        export = response.json()
        
        assert "contacts" in export
        assert "interactions" in export
        assert "goals" in export
        assert "settings" in export
        assert "exported_at" in export
        
        print(f"✓ Data export successful")
        print(f"  Contacts: {len(export['contacts'])}")
        print(f"  Interactions: {len(export['interactions'])}")

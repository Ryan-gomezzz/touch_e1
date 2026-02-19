"""
Backend API Tests for Touch CRM - Iteration 2 New Features
Tests: notifications/reminders, shared mode, calendar suggestions, premium, widget
"""
import pytest
import requests
import os

# Get backend URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or os.environ.get('BACKEND_URL', 'https://human-first-mobile.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')


class TestNotificationsReminders:
    """Notifications and reminders endpoints"""
    
    def test_get_pending_reminders(self, api_client):
        """Test GET /api/notifications/pending returns pending reminders with contact info"""
        response = api_client.get(f"{BASE_URL}/api/notifications/pending")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "reminders" in data
        assert "total" in data
        assert isinstance(data["reminders"], list)
        assert isinstance(data["total"], int)
        
        # Validate reminder structure if any exist
        if len(data["reminders"]) > 0:
            reminder = data["reminders"][0]
            assert "id" in reminder
            assert "contact_id" in reminder
            assert "contact_name" in reminder
            assert "relationship_tag" in reminder
            assert "message" in reminder
            assert "health" in reminder
            assert "days_overdue" in reminder
            assert "priority" in reminder
            assert "status" in reminder
            assert "avatar_color" in reminder
            
            # Validate data types
            assert isinstance(reminder["health"], (int, float))
            assert isinstance(reminder["days_overdue"], int)
            assert reminder["priority"] in ["gentle", "warm"]
            assert reminder["status"] == "pending"
            
            print(f"✓ Got {len(data['reminders'])} pending reminders (total: {data['total']})")
            print(f"  First reminder: {reminder['contact_name']} - {reminder['message'][:50]}...")
        else:
            print(f"✓ No pending reminders (all connections healthy)")


class TestSharedMode:
    """Shared mode endpoints"""
    
    def test_create_shared_invite_and_verify(self, api_client):
        """Test POST /api/shared/invite creates shared invitation"""
        # Get some contacts to share
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        contact_ids = [contacts[0]["id"], contacts[1]["id"]] if len(contacts) >= 2 else []
        
        invite_payload = {
            "partner_name": "TEST_Jane Partner",
            "partner_email": "test_jane@example.com",
            "shared_contact_ids": contact_ids,
            "mode": "couple"
        }
        
        # Create invite
        create_response = api_client.post(
            f"{BASE_URL}/api/shared/invite",
            json=invite_payload
        )
        assert create_response.status_code == 200
        invite = create_response.json()
        
        # Validate structure
        assert "id" in invite
        assert invite["partner_name"] == invite_payload["partner_name"]
        assert invite["partner_email"] == invite_payload["partner_email"]
        assert invite["mode"] == invite_payload["mode"]
        assert "status" in invite
        assert invite["status"] == "pending"
        assert "created_at" in invite
        
        print(f"✓ Created shared invite: {invite['id']}")
        print(f"  Partner: {invite['partner_name']} ({invite['mode']})")
        print(f"  Shared contacts: {len(invite['shared_contact_ids'])}")
        
        return invite["id"]
    
    def test_get_shared_invites(self, api_client):
        """Test GET /api/shared/invites returns list of invites"""
        response = api_client.get(f"{BASE_URL}/api/shared/invites")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "invites" in data
        assert isinstance(data["invites"], list)
        
        # If invites exist, validate structure
        if len(data["invites"]) > 0:
            invite = data["invites"][0]
            assert "id" in invite
            assert "partner_name" in invite
            assert "mode" in invite
            assert "status" in invite
            assert invite["mode"] in ["couple", "coparent"]
            
            print(f"✓ Got {len(data['invites'])} shared invites")
        else:
            print(f"✓ No shared invites yet")


class TestCalendarSuggestions:
    """Calendar AI scheduling suggestions"""
    
    def test_get_suggested_times(self, api_client):
        """Test GET /api/calendar/suggest-times/{contact_id} returns AI scheduling suggestions"""
        # Get a contact
        contacts = api_client.get(f"{BASE_URL}/api/contacts").json()
        assert len(contacts) > 0
        contact_id = contacts[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/calendar/suggest-times/{contact_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "contact_name" in data
        assert "suggested_times" in data
        assert "best_duration" in data
        assert "availability_tip" in data
        
        # Validate suggested times
        assert isinstance(data["suggested_times"], list)
        assert len(data["suggested_times"]) >= 1  # Should have at least one suggestion
        
        if len(data["suggested_times"]) > 0:
            time_slot = data["suggested_times"][0]
            assert "day" in time_slot
            assert "time" in time_slot
            assert "reason" in time_slot
            
            # Validate data types
            assert isinstance(time_slot["day"], str)
            assert isinstance(time_slot["time"], str)
            assert isinstance(time_slot["reason"], str)
        
        assert isinstance(data["best_duration"], int)
        assert data["best_duration"] > 0
        
        print(f"✓ Got calendar suggestions for {data['contact_name']}")
        print(f"  Suggested times: {len(data['suggested_times'])}")
        print(f"  Best duration: {data['best_duration']} minutes")
        if len(data["suggested_times"]) > 0:
            print(f"  Example: {data['suggested_times'][0]['day']} at {data['suggested_times'][0]['time']}")


class TestPremiumFeatures:
    """Premium/Freemium tier management"""
    
    def test_get_premium_status(self, api_client):
        """Test GET /api/premium/status returns premium tier info with plans"""
        response = api_client.get(f"{BASE_URL}/api/premium/status")
        assert response.status_code == 200
        status = response.json()
        
        # Validate structure
        assert "tier" in status
        assert "contact_limit" in status
        assert "contacts_used" in status
        assert "features" in status
        assert "plans" in status
        
        # Validate tier
        assert status["tier"] in ["free", "plus", "premium"]
        
        # Validate features
        features = status["features"]
        assert "ai_call_prep" in features
        assert "ai_insights" in features
        assert "voice_recording" in features
        assert "shared_mode" in features
        assert "unlimited_contacts" in features
        assert "calendar_suggestions" in features
        assert "advanced_memory_bank" in features
        assert isinstance(features["ai_call_prep"], bool)
        
        # Validate plans
        assert isinstance(status["plans"], list)
        assert len(status["plans"]) == 3  # free, plus, premium
        
        for plan in status["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "contacts" in plan
            assert "features" in plan
            assert plan["id"] in ["free", "plus", "premium"]
            assert isinstance(plan["features"], list)
        
        print(f"✓ Premium status:")
        print(f"  Current tier: {status['tier']}")
        print(f"  Contacts: {status['contacts_used']}/{status['contact_limit']}")
        print(f"  Plans available: {len(status['plans'])}")
    
    def test_upgrade_premium_and_verify(self, api_client):
        """Test PUT /api/premium/upgrade?tier=plus upgrades premium tier"""
        # Upgrade to plus
        upgrade_response = api_client.put(f"{BASE_URL}/api/premium/upgrade?tier=plus")
        assert upgrade_response.status_code == 200
        upgrade_result = upgrade_response.json()
        
        assert "message" in upgrade_result
        assert "tier" in upgrade_result
        assert upgrade_result["tier"] == "plus"
        
        print(f"✓ Upgraded to {upgrade_result['tier']}")
        
        # Verify with GET
        status_response = api_client.get(f"{BASE_URL}/api/premium/status")
        status = status_response.json()
        assert status["tier"] == "plus"
        
        # Verify features are enabled
        assert status["features"]["ai_call_prep"] == True
        assert status["features"]["unlimited_contacts"] == True
        assert status["contact_limit"] == 999
        
        print(f"✓ Premium upgrade persisted correctly")


class TestWidgetData:
    """Widget data endpoint"""
    
    def test_get_widget_data(self, api_client):
        """Test GET /api/widget/data returns widget data with pinned contacts and score"""
        response = api_client.get(f"{BASE_URL}/api/widget/data")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "pinned_contacts" in data
        assert "overall_score" in data
        assert "suggested_name" in data
        
        # Validate pinned contacts
        assert isinstance(data["pinned_contacts"], list)
        
        if len(data["pinned_contacts"]) > 0:
            contact = data["pinned_contacts"][0]
            assert "name" in contact
            assert "health" in contact
            assert "avatar_color" in contact
            assert "relationship_tag" in contact
            
            # Validate data types
            assert isinstance(contact["name"], str)
            assert isinstance(contact["health"], (int, float))
            assert isinstance(contact["avatar_color"], str)
            
            print(f"✓ Widget data retrieved")
            print(f"  Pinned contacts: {len(data['pinned_contacts'])}")
            print(f"  Overall score: {data['overall_score']}%")
            print(f"  Suggested contact: {data['suggested_name']}")
        else:
            print(f"✓ Widget data retrieved (no pinned contacts)")
            print(f"  Overall score: {data['overall_score']}%")

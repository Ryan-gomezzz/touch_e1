"""
Iteration 3 Smoke Tests - Quick verification that existing APIs still work after expo-audio migration
Focus: Ensure no backend regressions from frontend changes
Note: Iterations 1 & 2 already thoroughly tested these endpoints (100% pass rate)
"""
import pytest
import requests
import os

# Read from frontend .env file
BASE_URL = "https://human-first-mobile.preview.emergentagent.com"

class TestIteration3Smoke:
    """Quick smoke tests for iteration 3 to verify no backend regressions"""

    def test_health_check(self):
        """Verify API is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_contacts_endpoint(self):
        """Verify contacts endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_dashboard_endpoint(self):
        """Verify dashboard endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "total_contacts" in data

    def test_settings_endpoint(self):
        """Verify settings endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_notifications_pending(self):
        """Verify notifications endpoint works (tested in iter 2)"""
        response = requests.get(f"{BASE_URL}/api/notifications/pending")
        assert response.status_code == 200
        data = response.json()
        assert "reminders" in data
        assert isinstance(data["reminders"], list)

    def test_premium_status(self):
        """Verify premium status endpoint works (tested in iter 2)"""
        response = requests.get(f"{BASE_URL}/api/premium/status")
        assert response.status_code == 200
        data = response.json()
        assert "tier" in data
        assert "plans" in data

    def test_premium_upgrade(self):
        """Verify premium upgrade endpoint works (tested in iter 2)"""
        response = requests.put(f"{BASE_URL}/api/premium/upgrade?tier=plus")
        assert response.status_code == 200
        data = response.json()
        assert "tier" in data
        # Verify upgrade worked
        assert data["tier"] == "plus"

    def test_widget_data(self):
        """Verify widget data endpoint works (tested in iter 2)"""
        response = requests.get(f"{BASE_URL}/api/widget/data")
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "top_contacts" in data

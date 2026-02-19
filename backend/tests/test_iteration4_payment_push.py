"""
Iteration 4 Backend Tests: Razorpay Payment Integration & Expo Push Notifications
Tests: Payment order creation, verification, subscription management, push token registration, push notifications
"""
import pytest
import requests
import os

# Load environment from frontend .env
from pathlib import Path
from dotenv import load_dotenv

frontend_env = Path('/app/frontend/.env')
if frontend_env.exists():
    load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://human-first-mobile.preview.emergentagent.com').rstrip('/')

class TestRazorpayPayment:
    """Razorpay payment integration tests (test mode)"""

    def test_create_order_plus_plan(self):
        """Test POST /api/payment/create-order for Plus plan"""
        response = requests.post(f"{BASE_URL}/api/payment/create-order?plan_id=plus")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "order_id" in data, "Missing order_id in response"
        assert "amount" in data, "Missing amount in response"
        assert "currency" in data, "Missing currency in response"
        assert "plan_id" in data, "Missing plan_id in response"
        assert "plan_name" in data, "Missing plan_name in response"
        assert "razorpay_key_id" in data, "Missing razorpay_key_id in response"
        assert "test_mode" in data, "Missing test_mode flag in response"
        
        # Verify Plus plan details
        assert data["plan_id"] == "plus"
        assert data["plan_name"] == "Touch Plus"
        assert data["amount"] == 49900, f"Expected 49900 paise (₹499), got {data['amount']}"
        assert data["currency"] == "INR"
        assert data["test_mode"] is True, "Should be in test mode with placeholder keys"
        assert data["razorpay_key_id"] == "rzp_test_PLACEHOLDER"
        
        print(f"✓ Plus plan order created: {data['order_id']}, amount: ₹{data['amount']/100}")

    def test_create_order_premium_plan(self):
        """Test POST /api/payment/create-order for Premium plan"""
        response = requests.post(f"{BASE_URL}/api/payment/create-order?plan_id=premium")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["plan_id"] == "premium"
        assert data["plan_name"] == "Touch Premium"
        assert data["amount"] == 99900, f"Expected 99900 paise (₹999), got {data['amount']}"
        assert data["currency"] == "INR"
        assert data["test_mode"] is True
        
        print(f"✓ Premium plan order created: {data['order_id']}, amount: ₹{data['amount']/100}")

    def test_create_order_invalid_plan(self):
        """Test POST /api/payment/create-order with invalid plan ID"""
        response = requests.post(f"{BASE_URL}/api/payment/create-order?plan_id=invalid_plan")
        assert response.status_code == 400, f"Expected 400 for invalid plan, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "Invalid plan" in data["detail"]
        
        print("✓ Invalid plan rejected with 400 error")

    def test_verify_payment_test_mode(self):
        """Test POST /api/payment/verify with test mode payment"""
        # First create an order
        create_response = requests.post(f"{BASE_URL}/api/payment/create-order?plan_id=plus")
        assert create_response.status_code == 200
        order_data = create_response.json()
        order_id = order_data["order_id"]
        
        # Simulate payment verification
        import time
        test_payment_id = f"pay_test_{int(time.time())}"
        verify_response = requests.post(
            f"{BASE_URL}/api/payment/verify",
            params={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": test_payment_id,
                "razorpay_signature": "test_signature",
                "plan_id": "plus"
            }
        )
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        verify_data = verify_response.json()
        assert verify_data["verified"] is True
        assert verify_data["plan_id"] == "plus"
        assert "message" in verify_data
        assert "test mode" in verify_data["message"].lower()
        
        print(f"✓ Payment verified successfully for order {order_id}")

    def test_get_subscription_after_payment(self):
        """Test GET /api/payment/subscription returns active subscription after payment"""
        # First create and verify a payment
        create_response = requests.post(f"{BASE_URL}/api/payment/create-order?plan_id=premium")
        order_data = create_response.json()
        
        import time
        verify_response = requests.post(
            f"{BASE_URL}/api/payment/verify",
            params={
                "razorpay_order_id": order_data["order_id"],
                "razorpay_payment_id": f"pay_test_{int(time.time())}",
                "razorpay_signature": "test_signature",
                "plan_id": "premium"
            }
        )
        assert verify_response.status_code == 200
        
        # Now get subscription status
        sub_response = requests.get(f"{BASE_URL}/api/payment/subscription")
        assert sub_response.status_code == 200
        
        sub_data = sub_response.json()
        assert sub_data["active"] is True
        assert sub_data["plan_id"] == "premium"
        assert sub_data["status"] == "active"
        assert "started_at" in sub_data
        assert "expires_at" in sub_data
        assert "amount" in sub_data
        assert "currency" in sub_data
        
        print(f"✓ Active subscription retrieved: {sub_data['plan_id']}, expires: {sub_data['expires_at']}")

    def test_cancel_subscription(self):
        """Test POST /api/payment/cancel cancels active subscription"""
        response = requests.post(f"{BASE_URL}/api/payment/cancel")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "cancelled" in data["message"].lower()
        assert data["plan_id"] == "free"
        
        # Verify subscription is now inactive
        sub_response = requests.get(f"{BASE_URL}/api/payment/subscription")
        sub_data = sub_response.json()
        assert sub_data["active"] is False
        assert sub_data["plan_id"] == "free"
        
        print("✓ Subscription cancelled successfully, reverted to free plan")


class TestExpoPushNotifications:
    """Expo Push Service integration tests"""

    def test_register_push_token(self):
        """Test POST /api/push/register registers an Expo push token"""
        test_token = f"ExponentPushToken[TEST_TOKEN_{int(__import__('time').time())}]"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={
                "token": test_token,
                "device_id": "test_device_001",
                "platform": "ios"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["registered"] is True
        assert data["token"] == test_token
        
        print(f"✓ Push token registered: {test_token}")

    def test_register_push_token_minimal(self):
        """Test POST /api/push/register with minimal data (only token)"""
        test_token = f"ExponentPushToken[MINIMAL_{int(__import__('time').time())}]"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"token": test_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["registered"] is True
        assert data["token"] == test_token
        
        print(f"✓ Push token registered with minimal data: {test_token}")

    def test_send_reminder_push_notifications(self):
        """Test POST /api/push/send-reminders sends push notifications for contacts needing attention"""
        # First register a push token
        test_token = f"ExponentPushToken[REMINDER_TEST_{int(__import__('time').time())}]"
        register_response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"token": test_token, "platform": "ios"}
        )
        assert register_response.status_code == 200
        
        # Send reminder notifications
        response = requests.post(f"{BASE_URL}/api/push/send-reminders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sent" in data
        assert "message" in data or "contacts_notified" in data or "response" in data
        
        # If there are contacts needing attention, we should get notifications sent
        if data["sent"] > 0:
            assert "contacts_notified" in data
            assert data["contacts_notified"] > 0
            print(f"✓ Sent {data['sent']} push notifications for {data['contacts_notified']} contacts")
        else:
            # All connections healthy or no tokens registered
            print(f"✓ No reminders needed: {data.get('message', 'All connections healthy')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

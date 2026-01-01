import requests
import json

# Test the IoT device endpoints
BASE_URL = "http://127.0.0.1:8001/api"

# First, let's try to get the authentication token
login_data = {
    "login": "superadmin",
    "password": "123"
}

response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
if response.status_code == 200:
    token = response.json()['token']
    print("Successfully authenticated with token:", token[:10] + "...")
    
    # Set headers with the token
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    # Test getting IoT devices
    print("\n1. Testing GET /iot-devices/")
    response = requests.get(f"{BASE_URL}/iot-devices/", headers=headers)
    if response.status_code == 200:
        devices = response.json()
        print(f"   Successfully retrieved {len(devices)} IoT devices")
        if devices:
            print(f"   First device: {devices[0]['device_id']}")
    else:
        print(f"   Failed to get devices: {response.status_code} - {response.text}")
    
    # Test sending sensor data (this endpoint doesn't require authentication)
    print("\n2. Testing POST /iot-devices/data/update/")
    sensor_data = {
        "device_id": "ESP-A4C416",  # This should match an existing device
        "temperature": 25.3,
        "humidity": 36.1,
        "sleep_seconds": 2000,
        "timestamp": 1734680400
    }
    
    # Try without authentication first (as per the view definition)
    response = requests.post(f"{BASE_URL}/iot-devices/data/update/", json=sensor_data)
    if response.status_code == 200:
        print("   Successfully sent sensor data to device ESP-A4C416")
        print(f"   Response: {response.json()}")
    else:
        print(f"   Failed to send sensor data: {response.status_code} - {response.text}")
        
        # If it fails, try with authentication
        response = requests.post(f"{BASE_URL}/iot-devices/data/update/", json=sensor_data, headers=headers)
        if response.status_code == 200:
            print("   Successfully sent sensor data with authentication")
            print(f"   Response: {response.json()}")
        else:
            print(f"   Failed to send sensor data even with auth: {response.status_code} - {response.text}")
    
    # Test getting a specific device if any exist
    if 'devices' in locals():
        if devices:
            device_id = devices[0]['id']
        print(f"\n3. Testing GET /iot-devices/{device_id}/")
        response = requests.get(f"{BASE_URL}/iot-devices/{device_id}/", headers=headers)
        if response.status_code == 200:
            device = response.json()
            print(f"   Successfully retrieved device: {device['device_id']}")
        else:
            print(f"   Failed to get device: {response.status_code} - {response.text}")
    
    print("\nIoT endpoint testing completed!")
else:
    print("Failed to authenticate:", response.text)
import requests

def test_api():
    base_url = 'http://localhost:3000'
    
    # Test GET /contacts
    print("Testing GET /contacts...")
    try:
        response = requests.get(f"{base_url}/contacts")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test POST /contacts
    print("\nTesting POST /contacts...")
    try:
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "1234567890"
        }
        response = requests.post(f"{base_url}/contacts", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
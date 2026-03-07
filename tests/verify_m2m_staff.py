import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_m2m_staff_flow():
    print("Starting M2M Staff Flow Verification...")

    # 1. Create a global staff member
    staff_data = {
        "name": "M2M Test Agent",
        "role": "Multi-Tasker",
        "personality": "UBiquitous",
        "expertise": ["Multitasking", "Concurrency"],
        "system_prompt": "You work for everyone."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/staff/", json=staff_data)
        response.raise_for_status()
        staff = response.json()
        staff_id = staff["id"]
        print(f"Created global staff: {staff['name']} (ID: {staff_id})")
        assert len(staff["companies"]) == 0
    except Exception as e:
        print(f"Failed to create global staff: {e}")
        return

    # 2. Get two company IDs
    try:
        response = requests.get(f"{BASE_URL}/companies")
        response.raise_for_status()
        companies = response.json()
        if len(companies) < 2:
            print("Need at least 2 companies to test M2M. Please create another company first.")
            return
        c1_id = companies[0]["id"]
        c2_id = companies[1]["id"]
        print(f"Using companies: {c1_id} and {c2_id} for testing.")
    except Exception as e:
        print(f"Failed to get companies: {e}")
        return

    # 3. Hire into Company 1
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/hire/{c1_id}")
        response.raise_for_status()
        hired_staff = response.json()
        assert any(c["id"] == c1_id for c in hired_staff["companies"])
        print(f"Hired into Company {c1_id}.")
    except Exception as e:
        print(f"Failed to hire into C1: {e}")
        return

    # 4. Hire into Company 2
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/hire/{c2_id}")
        response.raise_for_status()
        hired_staff = response.json()
        assert any(c["id"] == c1_id for c in hired_staff["companies"])
        assert any(c["id"] == c2_id for c in hired_staff["companies"])
        print(f"Hired into Company {c2_id}. Agent is now shared!")
    except Exception as e:
        print(f"Failed to hire into C2: {e}")
        return

    # 5. Fire from Company 1
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/fire?company_id={c1_id}")
        response.raise_for_status()
        fired_staff = response.json()
        assert not any(c["id"] == c1_id for c in fired_staff["companies"])
        assert any(c["id"] == c2_id for c in fired_staff["companies"])
        print(f"Fired from Company {c1_id}. Still working for Company {c2_id}.")
    except Exception as e:
        print(f"Failed to fire from C1: {e}")
        return

    # 6. Fire from Company 2 (Total return to pool)
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/fire?company_id={c2_id}")
        response.raise_for_status()
        fired_staff = response.json()
        assert len(fired_staff["companies"]) == 0
        print(f"Fired from Company {c2_id}. Agent is back in global pool.")
    except Exception as e:
        print(f"Failed to fire from C2: {e}")
        return

    # 7. Clean up
    requests.delete(f"{BASE_URL}/staff/{staff_id}")
    print("Verification Successful!")

if __name__ == "__main__":
    test_m2m_staff_flow()

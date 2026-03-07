import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_global_staff_flow():
    print("Starting Global Staff Flow Verification...")

    # 1. Create a global staff member
    staff_data = {
        "name": "Global Test Agent",
        "role": "Tester",
        "personality": "Meticulous and automated",
        "expertise": ["Testing", "Automation"],
        "system_prompt": "You are a test agent."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/staff/", json=staff_data)
        response.raise_for_status()
        staff = response.json()
        staff_id = staff["id"]
        print(f"Created global staff: {staff['name']} (ID: {staff_id})")
        assert staff["company_id"] is None
    except Exception as e:
        print(f"Failed to create global staff: {e}")
        return

    # 2. Verify it appears in global pool
    try:
        response = requests.get(f"{BASE_URL}/staff/global")
        response.raise_for_status()
        pool = response.json()
        assert any(s["id"] == staff_id for s in pool)
        print("Verified staff appears in global pool.")
    except Exception as e:
        print(f"Failed to verify global pool: {e}")
        return

    # 3. Get a company ID (assuming at least one exists)
    try:
        response = requests.get(f"{BASE_URL}/companies")
        response.raise_for_status()
        companies = response.json()
        if not companies:
            print("No companies found to test hiring. Please create a company first.")
            return
        company_id = companies[0]["id"]
        print(f"Using company ID: {company_id} for testing.")
    except Exception as e:
        print(f"Failed to get companies: {e}")
        return

    # 4. Hire the staff member
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/hire/{company_id}")
        response.raise_for_status()
        hired_staff = response.json()
        assert hired_staff["company_id"] == company_id
        print(f"Successfully hired staff {staff_id} into company {company_id}.")
    except Exception as e:
        print(f"Failed to hire staff: {e}")
        return

    # 5. Verify they are no longer in global pool
    try:
        response = requests.get(f"{BASE_URL}/staff/global")
        response.raise_for_status()
        pool = response.json()
        assert not any(s["id"] == staff_id for s in pool)
        print("Verified staff is no longer in global pool.")
    except Exception as e:
        print(f"Failed to verify global pool after hire: {e}")
        return

    # 6. Fire (unassign) the staff member
    try:
        response = requests.post(f"{BASE_URL}/staff/{staff_id}/fire")
        response.raise_for_status()
        fired_staff = response.json()
        assert fired_staff["company_id"] is None
        print(f"Successfully fired staff {staff_id} (returned to pool).")
    except Exception as e:
        print(f"Failed to fire staff: {e}")
        return

    # 7. Verify they are back in global pool
    try:
        response = requests.get(f"{BASE_URL}/staff/global")
        response.raise_for_status()
        pool = response.json()
        assert any(s["id"] == staff_id for s in pool)
        print("Verified staff is back in global pool.")
    except Exception as e:
        print(f"Failed to verify global pool after fire: {e}")
        return

    # 8. Clean up (delete from system)
    try:
        response = requests.delete(f"{BASE_URL}/staff/{staff_id}")
        response.raise_for_status()
        print(f"Deleted test staff {staff_id} from system.")
    except Exception as e:
        print(f"Failed to delete test staff: {e}")
        return

    print("\nVerification Successful!")

if __name__ == "__main__":
    test_global_staff_flow()

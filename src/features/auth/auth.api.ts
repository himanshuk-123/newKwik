/**
 * Auth API calls
 * Communicates with backend API
 * Only works ONLINE
 */

const BASE_URL = "https://uat.kwikcheck.in"; // ⚠️ UPDATE THIS

export interface LoginApiPayload {
  username: string;
  password: string;
}

/**
 * Login API call
 * POST /App/webservice/Login
 */
export async function loginApi(payload: LoginApiPayload): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        UserName: payload.username,
        Pass: payload.password,
        IMEI:"a546acc999b8918e",
        Version:"6",
        IP:"162.158.86.21",
        Location:null
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Login Response Data: ", data)
    return data;
  } catch (error) {
    console.error("[API] Login error:", error);
    throw error;
  }
}

/**
 * Fetch companies for dropdown
 * GET /App/webservice/ClientCompanyList
 */
loginApi.fetchClientCompanyList = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/ClientCompanyList`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch companies failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch companies error:", error);
    throw error;
  }
};

/**
 * Fetch states for dropdown
 * (API endpoint needs to be confirmed)
 */
loginApi.fetchStateList = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/StateList`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch states failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch states error:", error);
    throw error;
  }
};

/**
 * Fetch cities for dropdown
 */
loginApi.fetchCityList = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/CityList`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch cities failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch cities error:", error);
    throw error;
  }
};

/**
 * Fetch yards for dropdown
 */
loginApi.fetchYardList = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/YardList`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch yards failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch yards error:", error);
    throw error;
  }
};

/**
 * Fetch dashboard metrics
 * GET /App/webservice/AppDashboard
 */
loginApi.fetchDashboard = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/AppDashboard`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch dashboard failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch dashboard error:", error);
    throw error;
  }
};

/**
 * Fetch vehicle types for a company
 * GET /App/webservice/CompanyVehicleList?CompanyId={companyId}
 */
loginApi.fetchVehicleTypesForCompany = async (token: string, companyId: number): Promise<any> => {
  try {
    const response = await fetch(
      `${BASE_URL}/App/webservice/CompanyVehicleList?CompanyId=${companyId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fetch vehicle types failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch vehicle types error:", error);
    throw error;
  }
};

/**
 * Fetch areas for a city
 * GET /App/webservice/CityAreaList?CityId={cityId}
 */
loginApi.fetchAreasForCity = async (token: string, cityId: number): Promise<any> => {
  try {
    const response = await fetch(
      `${BASE_URL}/App/webservice/CityAreaList?CityId=${cityId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fetch areas failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Fetch areas error:", error);
    throw error;
  }
};

/**
 * Submit create lead to server
 * POST /App/webservice/CreateLead
 */
loginApi.submitCreateLead = async (token: string, leadData: any): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/App/webservice/CreateLead`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      throw new Error(`Submit lead failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Submit lead error:", error);
    throw error;
  }
};

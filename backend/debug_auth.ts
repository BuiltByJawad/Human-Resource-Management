import axios from 'axios'

const API_URL = 'http://localhost:5000/api'
const EMAIL = 'admin@novahr.com'
const PASSWORD = 'password123'

const runTest = async () => {
  try {
    console.log('1. Attempting Login...')
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    })
    const token = loginRes.data.data.accessToken
    console.log('Login successful. Token:', token ? 'Present' : 'Missing')

    console.log('\n2. Testing /attendance/clock-in with valid location...')
    try {
      await axios.post(
        `${API_URL}/attendance/clock-in`,
        { latitude: 23.8103, longitude: 90.4125 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Clock-in successful!')
    } catch (error: any) {
      console.error('Clock-in failed:', error.response?.status, error.response?.data)
    }

  } catch (error: any) {
    console.error('Test failed:', error.message)
    if (error.response) {
        console.error('Response data:', error.response.data)
    }
  }
}

runTest()

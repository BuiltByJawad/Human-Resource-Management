import axios from 'axios'

const API_URL = 'http://localhost:5006/api'
const EMAIL = 'admin@novahr.com' // Assuming this user exists
const PASSWORD = 'password123' // Assuming this is the password

const runTest = async () => {
    try {
        // 1. Login
        console.log('Logging in...')
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD,
        })
        const token = loginRes.data.data.token
        console.log('Login successful. Token obtained.')

        // 1.5 Test GET Attendance (Health Check)
        console.log('\nTesting GET /attendance...')
        try {
            await axios.get(`${API_URL}/attendance?limit=1`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log('SUCCESS: GET /attendance worked.')
        } catch (error: any) {
            console.error('FAILED: GET /attendance failed:', error.message)
            return // Stop if basic API fails
        }

        // 2. Test Clock In - Invalid Location (Far away)
        console.log('\nTesting Clock In - Invalid Location (1, 1)...')
        try {
            await axios.post(
                `${API_URL}/attendance/clock-in`,
                { latitude: 1, longitude: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            console.error('FAILED: Should have rejected invalid location!')
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('SUCCESS: Rejected invalid location as expected.')
                console.log('Error message:', error.response.data.error)
            } else {
                console.error('FAILED: Unexpected error:', error.message)
            }
        }

        // 3. Test Clock In - Valid Location (Dhaka Office)
        console.log('\nTesting Clock In - Valid Location (23.8103, 90.4125)...')
        try {
            const clockInRes = await axios.post(
                `${API_URL}/attendance/clock-in`,
                { latitude: 23.8103, longitude: 90.4125 },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            console.log('SUCCESS: Clocked in successfully.')
            console.log('Attendance ID:', clockInRes.data.data.id)

            // 4. Clock Out
            const attendanceId = clockInRes.data.data.id
            console.log('\nClocking Out...')
            await axios.put(
                `${API_URL}/attendance/clock-out/${attendanceId}`,
                { latitude: 23.8103, longitude: 90.4125 },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            console.log('SUCCESS: Clocked out successfully.')

        } catch (error: any) {
            console.log('Error details:', error.response?.data || error.message)
            const errorMsg = error.response?.data?.error

            // If already clocked in, we might need to clock out first or handle it
            if (typeof errorMsg === 'string' && errorMsg.includes('already clocked in')) {
                console.log('User already clocked in. Attempting to find active record and clock out...')
                // Fetch current status
                const statusRes = await axios.get(`${API_URL}/attendance`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { limit: 1 }
                })
                const record = statusRes.data.data[0]
                if (record && !record.checkOut) {
                    await axios.put(
                        `${API_URL}/attendance/clock-out/${record.id}`,
                        { latitude: 23.8103, longitude: 90.4125 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    console.log('Clocked out previous session. Retrying valid clock in...')
                    // Retry valid clock in
                    const retryRes = await axios.post(
                        `${API_URL}/attendance/clock-in`,
                        { latitude: 23.8103, longitude: 90.4125 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    console.log('SUCCESS: Clocked in successfully (after cleanup).')

                    // Cleanup clock out again
                    await axios.put(
                        `${API_URL}/attendance/clock-out/${retryRes.data.data.id}`,
                        { latitude: 23.8103, longitude: 90.4125 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    console.log('SUCCESS: Clocked out successfully.')
                }
            } else {
                console.error('FAILED: Valid clock in failed:', error.response?.data || error.message)
            }
        }

    } catch (error: any) {
        console.error('Test failed:', error.message)
    }
}

runTest()

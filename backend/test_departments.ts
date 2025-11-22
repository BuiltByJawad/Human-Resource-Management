import axios from 'axios'

const API_URL = 'http://localhost:5000/api'
const EMAIL = 'admin@novahr.com'
const PASSWORD = 'password123'

const runTest = async () => {
    try {
        // 1. Login
        console.log('Logging in...')
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD,
        })
        const token = loginRes.data.data.accessToken
        console.log('Login successful.')

        // 2. Create Parent Department
        console.log('\nCreating Parent Department...')
        const timestamp = Date.now()
        const parentName = `Engineering_${timestamp}`
        const parentRes = await axios.post(
            `${API_URL}/departments`,
            { name: parentName, description: 'Core Engineering Team' },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const parentId = parentRes.data.data.id
        console.log('Parent Department Created:', parentRes.data.data.name)

        // 3. Create Sub Department
        console.log('\nCreating Sub Department...')
        const subName = `Backend_${timestamp}`
        const subRes = await axios.post(
            `${API_URL}/departments`,
            { name: subName, description: 'Backend Devs', parentDepartmentId: parentId },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const subId = subRes.data.data.id
        console.log('Sub Department Created:', subRes.data.data.name)

        // 4. Get All Departments
        console.log('\nFetching All Departments...')
        const getAllRes = await axios.get(`${API_URL}/departments`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Departments found:', getAllRes.data.data.length)

        // 5. Get Parent Details (Check sub-departments)
        console.log('\nFetching Parent Details...')
        const getParentRes = await axios.get(`${API_URL}/departments/${parentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Sub-departments count:', getParentRes.data.data.subDepartments.length)

        // 6. Update Sub Department
        console.log('\nUpdating Sub Department...')
        await axios.put(
            `${API_URL}/departments/${subId}`,
            { description: 'Backend Wizards' },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        console.log('Sub Department Updated.')

        // 7. Delete Sub Department
        console.log('\nDeleting Sub Department...')
        await axios.delete(`${API_URL}/departments/${subId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Sub Department Deleted.')

        // 8. Delete Parent Department
        console.log('\nDeleting Parent Department...')
        await axios.delete(`${API_URL}/departments/${parentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Parent Department Deleted.')

    } catch (error: any) {
        console.error('Test failed:', error.message)
        if (error.response) {
            console.error('Response data:', error.response.data)
        }
    }
}

runTest()

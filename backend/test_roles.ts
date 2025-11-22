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

        // 2. Get Permissions
        console.log('\nFetching Permissions...')
        const permRes = await axios.get(`${API_URL}/roles/permissions`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const permissions = permRes.data.data
        console.log('Permissions found:', permissions.length)

        if (permissions.length === 0) {
            console.warn('No permissions found. Seeding might be needed.')
            // Proceeding without permissions for now, or maybe I should create some?
            // Assuming seed data exists.
        }

        const permIds = permissions.slice(0, 2).map((p: any) => p.id)

        // 3. Create Role
        console.log('\nCreating Role...')
        const timestamp = Date.now()
        const roleName = `TestRole_${timestamp}`
        const roleRes = await axios.post(
            `${API_URL}/roles`,
            {
                name: roleName,
                description: 'A test role',
                permissionIds: permIds
            },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const roleId = roleRes.data.data.id
        console.log('Role Created:', roleRes.data.data.name)
        console.log('Permissions assigned:', roleRes.data.data.permissions.length)

        // 4. Get All Roles
        console.log('\nFetching All Roles...')
        const getAllRes = await axios.get(`${API_URL}/roles`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Roles found:', getAllRes.data.data.length)

        // 5. Get Role Details
        console.log('\nFetching Role Details...')
        const getRoleRes = await axios.get(`${API_URL}/roles/${roleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Role fetched:', getRoleRes.data.data.name)

        // 6. Update Role
        console.log('\nUpdating Role...')
        await axios.put(
            `${API_URL}/roles/${roleId}`,
            { description: 'Updated description', permissionIds: [] }, // Remove permissions
            { headers: { Authorization: `Bearer ${token}` } }
        )
        console.log('Role Updated.')

        // 7. Delete Role
        console.log('\nDeleting Role...')
        await axios.delete(`${API_URL}/roles/${roleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Role Deleted.')

    } catch (error: any) {
        console.error('Test failed:', error.message)
        if (error.response) {
            console.error('Response data:', error.response.data)
        }
    }
}

runTest()

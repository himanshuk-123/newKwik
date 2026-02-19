import { View, Text,TouchableOpacity } from 'react-native'
import React from 'react'
import { useAuthStore } from '../features/auth/auth.store'
const DashboardPage = () => {
  return (
    <View>
      <Text>DashboardPage</Text>
      <TouchableOpacity onPress={() => useAuthStore.getState().logout()} style={{marginTop: 20}}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

export default DashboardPage
import React, { useEffect, useState } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

interface IOSCompatibilityProps {
  children: React.ReactNode
}

export default function IOSCompatibility({ children }: IOSCompatibilityProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // iOS特定的初始化
    if (Platform.OS === 'ios') {
      // 延迟渲染以确保iOS正确初始化
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#1a1a1a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <>
      {Platform.OS === 'ios' && <StatusBar style="light" />}
      {children}
    </>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16
  }
})

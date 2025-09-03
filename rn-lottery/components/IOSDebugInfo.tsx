import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

export default function IOSDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'ios' && __DEV__) {
      collectDebugInfo()
    }
  }, [])

  const collectDebugInfo = async () => {
    try {
      const info = {
        platform: Platform.OS,
        version: Platform.Version,
        constants: {
          appOwnership: Constants.appOwnership,
          expoVersion: Constants.expoVersion,
          deviceName: Constants.deviceName,
          isDevice: Constants.isDevice
        },
        env: {
          supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置',
          supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'
        },
        supabase: {
          url: supabase.supabaseUrl,
          connected: false
        }
      }

      // 测试Supabase连接
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1)
        info.supabase.connected = !error
        info.supabase.error = error?.message
      } catch (error) {
        info.supabase.error = (error as Error).message
      }

      setDebugInfo(info)
    } catch (error) {
      console.error('收集调试信息失败:', error)
    }
  }

  if (Platform.OS !== 'ios' || !__DEV__) {
    return null
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.debugButton} 
        onPress={() => setShowDebug(!showDebug)}
      >
        <Ionicons name="bug" size={20} color="#ffffff" />
        <Text style={styles.debugButtonText}>iOS调试</Text>
      </Pressable>

      {showDebug && (
        <ScrollView style={styles.debugPanel}>
          <Text style={styles.debugTitle}>iOS调试信息</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>平台信息</Text>
            <Text style={styles.debugText}>系统: {debugInfo.platform}</Text>
            <Text style={styles.debugText}>版本: {debugInfo.version}</Text>
            <Text style={styles.debugText}>设备: {debugInfo.constants?.deviceName}</Text>
            <Text style={styles.debugText}>真机: {debugInfo.constants?.isDevice ? '是' : '否'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>环境变量</Text>
            <Text style={styles.debugText}>Supabase URL: {debugInfo.env?.supabaseUrl}</Text>
            <Text style={styles.debugText}>Supabase Key: {debugInfo.env?.supabaseKey}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supabase连接</Text>
            <Text style={styles.debugText}>URL: {debugInfo.supabase?.url}</Text>
            <Text style={styles.debugText}>
              连接状态: {debugInfo.supabase?.connected ? '✅ 正常' : '❌ 失败'}
            </Text>
            {debugInfo.supabase?.error && (
              <Text style={styles.errorText}>错误: {debugInfo.supabase.error}</Text>
            )}
          </View>

          <Pressable style={styles.refreshButton} onPress={collectDebugInfo}>
            <Text style={styles.refreshButtonText}>刷新信息</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000
  },
  debugButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  debugPanel: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 16
  },
  debugTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  debugText: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 4
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 4
  },
  refreshButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center'
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold'
  }
})

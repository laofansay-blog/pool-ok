# 🍎 iOS白屏问题修复指南

## 🔍 问题分析

iPhone上的白屏问题通常由以下原因造成：

1. **环境变量问题** - iOS对环境变量处理更严格
2. **平台兼容性** - iOS特定的配置需求
3. **网络连接问题** - iOS网络安全策略
4. **初始化时序** - iOS应用启动时序不同

## ✅ 已实施的修复

### 1. 环境变量修复
- ✅ 修复了 `NEXT_PUBLIC_` → `EXPO_PUBLIC_` 前缀
- ✅ 在 `.env` 和 `lib/supabase.ts` 中统一使用正确前缀

### 2. iOS兼容性组件
创建了 `components/IOSCompatibility.tsx`：
- 延迟渲染确保iOS正确初始化
- iOS特定的StatusBar配置
- 平台检测和条件渲染

### 3. Supabase iOS配置
在 `lib/supabase.ts` 中添加：
```typescript
// iOS特定配置
...(Platform.OS === 'ios' && {
  flowType: 'pkce',
  debug: __DEV__
})
```

### 4. 错误边界和启动画面
- ✅ `ErrorBoundary.tsx` - 捕获崩溃
- ✅ `SplashScreen.tsx` - 显示加载状态
- ✅ 集成到根布局中

### 5. iOS调试工具
创建了 `components/IOSDebugInfo.tsx`：
- 实时显示平台信息
- 环境变量检查
- Supabase连接状态
- 仅在开发模式下显示

## 🧪 测试步骤

### 方法1: 使用Expo Go (推荐)

1. **启动开发服务器**：
   ```bash
   expo start --clear
   ```

2. **在iPhone上打开Expo Go**

3. **扫描二维码或输入URL**

4. **查看调试信息**：
   - 右上角会显示"iOS调试"按钮
   - 点击查看详细信息

### 方法2: 构建iOS版本

```bash
# 需要Apple开发者账户
eas build --platform ios --profile preview
```

## 🔧 调试信息解读

当你在iPhone上打开应用时，调试面板会显示：

### 平台信息
- ✅ 系统: ios
- ✅ 版本: iOS版本号
- ✅ 设备: 设备名称
- ✅ 真机: 是/否

### 环境变量
- ✅ Supabase URL: ✅ 已设置
- ✅ Supabase Key: ✅ 已设置

### Supabase连接
- ✅ 连接状态: ✅ 正常 / ❌ 失败
- 如果失败会显示具体错误信息

## 🚨 常见问题和解决方案

### 问题1: 仍然白屏
**可能原因**：
- 网络连接问题
- Supabase配置错误
- iOS安全策略阻止

**解决方案**：
1. 检查WiFi连接
2. 尝试使用手机数据
3. 查看调试信息中的错误

### 问题2: 调试按钮不显示
**原因**：应用不在开发模式
**解决方案**：确保使用 `expo start` 而不是构建版本

### 问题3: Supabase连接失败
**可能原因**：
- 环境变量未正确设置
- 网络防火墙
- iOS网络安全策略

**解决方案**：
1. 检查环境变量设置
2. 尝试不同网络
3. 查看具体错误信息

### 问题4: 应用崩溃
**解决方案**：
- 错误边界会显示友好提示
- 点击"重试"按钮
- 查看调试信息

## 📱 iOS特定注意事项

### 网络安全
iOS对网络请求有严格的安全策略：
- 确保Supabase URL使用HTTPS
- 检查网络权限设置

### 应用传输安全(ATS)
如果需要HTTP连接，需要在 `app.json` 中配置：
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    }
  }
}
```

### 权限设置
确保应用有必要的网络权限。

## 🎯 下一步测试

1. **在iPhone上使用Expo Go测试**
2. **查看调试信息**
3. **报告具体错误**（如果仍有问题）

## 📞 获取帮助

如果问题持续存在，请提供：

1. **iOS版本**
2. **设备型号**
3. **调试面板截图**
4. **具体错误信息**
5. **网络环境**（WiFi/数据）

## 🔄 快速重试

如果修复后仍有问题：

1. **完全关闭Expo Go应用**
2. **重新启动开发服务器**：
   ```bash
   expo start --clear --reset-cache
   ```
3. **重新扫描二维码**

现在请在iPhone上使用Expo Go测试，并查看右上角的调试信息！

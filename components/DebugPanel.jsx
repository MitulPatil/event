import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useGlobalContext } from '../context/GlobalProvider';

const DebugPanel = () => {
  const { debugFunctions } = useGlobalContext();

  // Only show in debug mode
  if (process.env.EXPO_PUBLIC_DEBUG_MODE !== 'true' || !debugFunctions) {
    return null;
  }

  const runDiagnosis = async () => {
    try {
      console.log("🔍 Running manual diagnosis...");
      const result = await debugFunctions.diagnoseCreators();
      
      if (result.success) {
        const { diagnosis } = result;
        const message = `
Posts: ${diagnosis.totalPosts}
Valid Creators: ${diagnosis.postsWithCreators}
Orphaned: ${diagnosis.orphanedPosts.length}
Invalid: ${diagnosis.postsWithInvalidCreators}
        `.trim();
        
        Alert.alert("Diagnosis Complete", message);
      } else {
        Alert.alert("Diagnosis Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const fixOrphaned = async () => {
    try {
      console.log("🔧 Running manual fix...");
      const result = await debugFunctions.fixOrphanedPosts();
      
      Alert.alert(
        "Fix Complete", 
        `Fixed ${result.fixed} out of ${result.total} posts`
      );
    } catch (error) {
      Alert.alert("Fix Failed", error.message);
    }
  };

  const testConnection = async () => {
    try {
      console.log("🔗 Testing connection...");
      const result = await debugFunctions.testConnection();
      
      Alert.alert(
        "Connection Test", 
        result.success ? "All services working!" : result.error
      );
    } catch (error) {
      Alert.alert("Test Failed", error.message);
    }
  };

  return (
    <View className="bg-red-900 p-4 m-4 rounded-lg">
      <Text className="text-white font-bold mb-2">🐛 DEBUG PANEL</Text>
      <Text className="text-red-200 text-xs mb-3">Fixing "Unknown User" issue</Text>
      
      <View className="flex-row justify-between">
        <TouchableOpacity 
          onPress={testConnection}
          className="bg-blue-600 px-3 py-2 rounded"
        >
          <Text className="text-white text-xs">Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={runDiagnosis}
          className="bg-yellow-600 px-3 py-2 rounded"
        >
          <Text className="text-white text-xs">Diagnose</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={fixOrphaned}
          className="bg-green-600 px-3 py-2 rounded"
        >
          <Text className="text-white text-xs">Fix</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DebugPanel;

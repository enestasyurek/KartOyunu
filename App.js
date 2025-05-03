// --- START OF FILE App.js ---

// App.js - Main Application Setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar, View, Text, StyleSheet, Alert } from 'react-native'; // Alert eklendi
import { GameProvider } from './context/GameProvider'; // Game State Management
import ErrorBoundary from './components/ErrorBoundary'; // Render Error Catching
import { COLORS, SIZES } from './constants/theme'; // Theming
import { useLoadAssets } from './hooks/useLoadAssets'; // Font/Asset Loading
import { Ionicons } from '@expo/vector-icons'; // İkonlar için (error state)

// --- Screen Imports ---
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import StatisticsScreen from './screens/StatisticsScreen';

// --- Global Error Handling (Opsiyonel, Production için önerilir) ---
// React render döngüsü dışındaki hataları yakalar
const globalErrorHandler = (error, isFatal) => {
     console.error("--- GLOBAL ERROR HANDLER CAUGHT ---");
     console.error("Timestamp:", new Date().toISOString());
     console.error("Error:", error?.message || error);
     console.error("Is Fatal:", isFatal);
      if (error?.stack) { console.error("Stack:", error.stack); }
     // Production'da bu hatayı bir raporlama servisine gönder (Sentry, Bugsnag vb.)
     // Sentry.captureException(error, { level: isFatal ? 'fatal' : 'error' });

      // İsteğe bağlı olarak basit bir uyarı göster veya bir hata ekranına yönlendir
      // Buradan UI'ı değiştirmek zor/güvenilmez olabilir
      if (isFatal) {
           Alert.alert(
              "Beklenmedik Hata",
               "Uygulamada ciddi bir hata oluştu. Lütfen uygulamayı yeniden başlatın."
               // [{ text: "Kapat" }] // Yeniden başlatma gerekebilir
           );
       }
};

// Global handler'ı yalnızca production modunda ekle (dev araçlarıyla çakışmaması için)
// Bu kısım geçici olarak devre dışı bırakılabilir, gerekirse açılır.
/*
if (!__DEV__) {
    const ErrorUtils = global.ErrorUtils;
    if (ErrorUtils) {
       ErrorUtils.setGlobalHandler(globalErrorHandler);
       console.log("Global Error Handler set for Production.");
   } else {
       console.warn("ErrorUtils not available to set global handler.");
   }
} else {
    console.log("Running in DEV mode, skipping global error handler setup.");
}
*/
console.log("Global Error Handler setup currently skipped/disabled."); // Geçici log

// --- Navigation Stack ---
const Stack = createStackNavigator();

// Uygulamanın navigasyon yapısını tanımlar
const AppNavigator = () => (
    <Stack.Navigator
        initialRouteName="Home" 
        screenOptions={{
            headerShown: false, 
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureEnabled: true, 
            gestureDirection: 'horizontal', 
            cardStyle: { backgroundColor: 'transparent' },
        }}
    >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Game" component={GameScreen} options={{ gestureEnabled: false }}/> 
        <Stack.Screen name="End" component={EndScreen} options={{ gestureEnabled: false }}/> 
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
);

// --- App Content Wrapper ---
// Uygulama içeriğini Error Boundary ile sarar
const AppContent = () => {
    // ErrorBoundary için Retry (Tekrar Dene) fonksiyonu
    const handleRetry = () => {
        console.warn("ErrorBoundary Retry triggered!");
        // Geliştirme modunda uygulamayı yeniden yükle
        if (__DEV__) {
             try {
                 const DevSettings = require('react-native').DevSettings;
                  if (DevSettings && DevSettings.reload) {
                     DevSettings.reload('ErrorBoundary Retry');
                  } else {
                      console.error("DevSettings.reload bulunamadı.");
                      Alert.alert("Hata", "Yeniden yükleme başarısız. Lütfen uygulamayı manuel olarak kapatıp açın.");
                  }
              } catch (e) {
                  console.error("DevSettings yüklenirken veya kullanılırken hata:", e);
                   Alert.alert("Hata", "Yeniden yükleme sırasında hata oluştu.");
              }
         } else {
        
              Alert.alert("Hata Giderilemedi", "Lütfen uygulamayı kapatıp yeniden açın.");
          }
      };

    return (
        <ErrorBoundary onRetry={handleRetry}>
            <AppNavigator />
        </ErrorBoundary>
    );
}

// --- Main App Component ---
// Uygulamanın ana giriş noktası
export default function App() {
    // Fontları ve gerekli varlıkları yükle
    const { isLoadingComplete, error: assetError } = useLoadAssets();

    // --- Yüklenme Durumu ---
    if (!isLoadingComplete) {
        // Splash Screen aktifken (preventAutoHideAsync ile), null döndürmek yeterlidir.
        return null;
    }

    // --- Varlık Yükleme Hatası Durumu ---
    if (assetError) {
         // Kritik varlıklar yüklenemediyse hata ekranı göster
        return (
            <View style={styles.errorContainer}>
                 <Ionicons name="alert-circle-outline" size={70} color={COLORS.white} style={{marginBottom: 15}}/>
                 <Text style={styles.errorText}>Uygulama Başlatılamadı</Text>
                 <Text style={styles.errorTextSmall}>Gerekli kaynaklar yüklenirken bir sorun oluştu. İnternet bağlantınızı kontrol edip uygulamayı yeniden başlatmayı deneyin.</Text>
                 {__DEV__ && <Text style={[styles.errorTextSmall, styles.devError]}>Hata: {assetError.message}</Text>}
            </View>
         );
     }

    // --- Ana Uygulamayı Render Et ---
    // Varlıklar yüklendi, uygulama hazır
    return (
        <GameProvider>
             <NavigationContainer>
                 <StatusBar
                     barStyle={'light-content'} // Koyu arka plan için açık renkli ikonlar/yazı
                      backgroundColor={COLORS.backgroundGradient[0]} // Arka plan gradient'ının üst rengiyle eşleştir
                     translucent={false} // Android'de içeriğin status bar altına girmesini engelle
                 />
                 <AppContent />
            </NavigationContainer>
         </GameProvider>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
   errorContainer: { // Hata ekranı stili
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: COLORS.negativeDark || '#c53030', // Hata için koyu kırmızı arka plan
       padding: SIZES.paddingLarge,
   },
   errorText: { // Ana hata mesajı
       color: COLORS.white,
       fontSize: SIZES.h2,
        fontFamily: SIZES.bold,
       textAlign: 'center',
       marginBottom: SIZES.margin,
   },
    errorTextSmall: { // Detay/açıklama mesajı
       color: COLORS.white,
       fontSize: SIZES.body,
       fontFamily: SIZES.regular,
       textAlign: 'center',
        lineHeight: SIZES.lineHeightBase * 1.1, // Satır aralığı
   },
   devError: { // Sadece DEV modunda görünen hata detayı
       marginTop: SIZES.marginLarge,
       opacity: 0.8,
       fontSize: SIZES.caption,
       fontFamily: 'monospace', // Hata için monospace font
   }
});
// --- END OF FILE App.js ---
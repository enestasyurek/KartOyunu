// components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ActionButton from './ActionButton'; // Butonumuzu kullanalım
import { COLORS, SIZES } from '../constants/theme'; // Renklerimizi kullanalım

// Hata durumunda loglama için basit bir global fonksiyon (GameProvider'daki logError'a benzer)
const logRenderError = (error, errorInfo) => {
     console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
     console.error(`--- React Render Error Boundary Caught ---`);
     console.error("Timestamp:", new Date().toISOString());
     console.error("Error:", error?.message || error);
     console.error("Component Stack:", errorInfo?.componentStack);
     console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
      // TODO: Entegre edilecekse Sentry gibi bir servise gönderme
      // Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // State'i güncelle, fallback UI gösterilsin
  static getDerivedStateFromError(error) {
    // Sadece hasError state'ini güncelle, diğer detaylar componentDidCatch'te
    return { hasError: true };
  }

  // Hata bilgisini logla ve state'e kaydet
  componentDidCatch(error, errorInfo) {
    this.setState({ error: error, errorInfo: errorInfo });
    logRenderError(error, errorInfo); // Hata loglama fonksiyonunu çağır
     // İsteğe bağlı: Hata raporlama servisine gönder
     // Sentry.captureException(error, { extra: errorInfo });
  }

  // Yeniden deneme fonksiyonu
  handleRetry = () => {
    console.log("Retrying after error boundary...");
    // Hata state'ini temizle
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Eğer dışarıdan bir retry fonksiyonu verildiyse onu çağır
    if(this.props.onRetry && typeof this.props.onRetry === 'function') {
        this.props.onRetry();
    } else {
        // Varsayılan davranış: Belki uygulamayı yeniden başlatmayı dene (dikkatli kullanılmalı)
        // import { DevSettings } from 'react-native';
        // DevSettings.reload();
        console.warn("No onRetry prop provided to ErrorBoundary. Resetting internal state only.");
    }
  };


  render() {
    if (this.state.hasError) {
      // Hata durumunda gösterilecek Fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Bir Hata Oluştu</Text>
          <Text style={styles.message}>Beklenmedik bir sorunla karşılaşıldı. Lütfen tekrar deneyin veya uygulamayı yeniden başlatın.</Text>
          {/* Hata detaylarını göstermek (sadece geliştirme sırasında) */}
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorDetailsScroll} persistentScrollbar={true}>
              <Text style={styles.errorTitle}>Hata Detayı:</Text>
              <Text selectable style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && this.state.errorInfo.componentStack && (
                <>
                  <Text style={styles.errorTitle}>Component Yığını:</Text>
                  <Text selectable style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                </>
              )}
            </ScrollView>
          )}
          <ActionButton
            title="Tekrar Dene / Kapat"
            onPress={this.handleRetry}
            type="danger"
            style={styles.button}
            iconLeft="refresh-outline" // İkon eklendi
          />
        </View>
      );
    }

    // Hata yoksa, çocuk bileşenleri normal şekilde render et
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25, // Biraz daha fazla padding
    backgroundColor: COLORS.backgroundGradient[1] || '#2d3748', // Fallback color
  },
  title: {
    fontSize: 26, // Biraz daha büyük
    fontFamily: SIZES.bold, // Kalın font
    color: COLORS.negative || '#f56565',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 17, // Biraz daha büyük
    fontFamily: SIZES.regular,
    color: COLORS.textSecondary || '#a0aec0',
    textAlign: 'center',
    marginBottom: 25, // Daha fazla boşluk
    lineHeight: 24, // Satır yüksekliği
  },
  errorDetailsScroll: {
      maxHeight: 250, // Biraz daha fazla alan
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: SIZES.inputRadius, // Daha yumuşak köşe
      padding: 15, // Daha fazla iç boşluk
      marginBottom: 25, // Daha fazla boşluk
      borderWidth: 1,
      borderColor: COLORS.textMuted,
  },
   errorTitle: {
      fontSize: 15, // Biraz daha büyük
      fontFamily: SIZES.bold, // Kalın font
      color: COLORS.warning || '#ed8936',
      marginTop: 10,
      marginBottom: 5,
   },
   errorText: {
      fontSize: 12, // Stack trace için daha küçük olabilir
      fontFamily: SIZES.regular, // Okunabilirlik için regular
      color: COLORS.textMuted || '#718096',
      marginTop: 5,
      lineHeight: 18,
   },
   button: {
       marginTop: 15, // Diğer elemanlarla boşluk
       width: '80%',
       maxWidth: 300,
   }
});

export default ErrorBoundary;
// --- END OF FILE ErrorBoundary.js ---
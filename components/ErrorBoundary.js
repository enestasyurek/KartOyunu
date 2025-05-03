// components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ActionButton from './ActionButton'; // Butonumuzu kullanalım
import { COLORS } from '../constants/theme'; // Renklerimizi kullanalım

// Hata durumunda loglama için basit bir global fonksiyon (GameProvider'daki logError'a benzer)
const logRenderError = (error, errorInfo) => {
     console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
     console.error(`--- React Render Error Boundary Caught ---`);
     console.error("Timestamp:", new Date().toISOString());
     console.error("Error:", error?.message || error);
     console.error("Component Stack:", errorInfo?.componentStack);
     console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
      // TODO: Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // State'i güncelle, fallback UI gösterilsin
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  // Hata bilgisini logla
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo: errorInfo });
    logRenderError(error, errorInfo); // Hata loglama fonksiyonunu çağır
     // İsteğe bağlı: Hata raporlama servisine gönder
     // Sentry.captureException(error, { extra: errorInfo });
  }

  // Yeniden deneme fonksiyonu (opsiyonel)
  handleRetry = () => {
    console.log("Retrying after error...");
    this.setState({ hasError: false, error: null, errorInfo: null });
    // İsteğe bağlı: Uygulamayı yeniden yüklemek için bir yöntem eklenebilir (örn. DevSettings.reload())
    // import { DevSettings } from 'react-native'; DevSettings.reload();
    // VEYA state'i sıfırlayan bir context action çağrılabilir.
    if(this.props.onRetry) {
        this.props.onRetry();
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
            <ScrollView style={styles.errorDetailsScroll}>
              <Text style={styles.errorTitle}>Hata Detayı:</Text>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <>
                  <Text style={styles.errorTitle}>Component Stack:</Text>
                  <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                </>
              )}
            </ScrollView>
          )}
          <ActionButton
            title="Tekrar Dene / Kapat"
            onPress={this.handleRetry}
            type="danger"
            style={styles.button}
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
    padding: 20,
    backgroundColor: COLORS.backgroundGradient[1] || '#2d3748', // Fallback color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.negative || '#f56565',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary || '#a0aec0',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetailsScroll: {
      maxHeight: 200,
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
  },
   errorTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: COLORS.warning || '#ed8936',
      marginTop: 10,
   },
   errorText: {
      fontSize: 12,
      color: COLORS.textMuted || '#718096',
      marginTop: 5,
   },
   button: {
       marginTop: 10,
       width: '80%',
       maxWidth: 300,
   }
});

export default ErrorBoundary;
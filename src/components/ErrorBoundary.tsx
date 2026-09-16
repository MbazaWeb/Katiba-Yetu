import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Root-level error boundary — prevents a white screen when a render error
 * occurs anywhere in the component tree.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[KatibaYetu] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>⚠</Text>
          <Text style={styles.title}>
            Samahani, kuna hitilafu / Something went wrong
          </Text>
          <Text style={styles.body}>
            {'Tumepata hitilafu isiyotarajiwa. Jaribu tena.\n'}
            {'An unexpected error occurred. Please try again.'}
          </Text>
          <Text style={styles.detail}>{this.state.message}</Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[3],
  },
  icon: {
    fontSize: 40,
    color: Colors.gold[400],
  },
  title: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.5,
  },
  detail: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
  },
});

export default AppErrorBoundary;

import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentStyle }: Props) {
  if (!scroll) {
    return <SafeAreaView edges={['top']} style={[styles.safe, styles.content, contentStyle]}>{children}</SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32 },
});

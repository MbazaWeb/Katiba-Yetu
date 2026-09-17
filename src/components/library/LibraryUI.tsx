import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/tokens';

export function Action({ label, onPress, selected, disabled, primary }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [libraryStyles.action, (selected || primary) && libraryStyles.selected, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}><Text style={libraryStyles.actionText}>{label}</Text></Pressable>;
}
export function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return <Text>{text}</Text>;
  const result: React.ReactNode[] = []; let start = 0;
  let index = text.toLocaleLowerCase().indexOf(needle);
  while (index !== -1) {
    result.push(text.slice(start, index));
    result.push(<Text key={index} style={{ backgroundColor: '#eabd08', color: '#101714' }}>{text.slice(index, index + needle.length)}</Text>);
    start = index + needle.length; index = text.toLocaleLowerCase().indexOf(needle, start);
  }
  result.push(text.slice(start)); return <Text>{result}</Text>;
}
export function Notice({ children }: { children: React.ReactNode }) { return <View style={libraryStyles.notice}><Text style={libraryStyles.body}>{children}</Text></View>; }
export const libraryStyles = StyleSheet.create({
  root: { flex: 1, minWidth: 0, backgroundColor: Colors.surface.base },
  content: { padding: 20, gap: 18, width: '100%', maxWidth: 1100, alignSelf: 'center', paddingBottom: 40 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  card: { padding: 18, gap: 12, backgroundColor: Colors.surface.raised, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: 12 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: Colors.text.primary },
  heading: { fontSize: 19, lineHeight: 28, fontWeight: '600', color: Colors.text.primary },
  body: { fontSize: 15, lineHeight: 24, color: Colors.text.secondary },
  small: { fontSize: 12, lineHeight: 19, color: Colors.text.secondary },
  input: { color: Colors.text.primary, padding: 13, minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: 9, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  action: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.surface.borderStrong, justifyContent: 'center', backgroundColor: Colors.surface.overlay, maxWidth: '100%' },
  actionText: { color: Colors.text.primary, fontSize: 14, lineHeight: 21 },
  selected: { backgroundColor: '#075239', borderColor: '#20b66c' },
  notice: { padding: 14, borderLeftWidth: 3, borderColor: Colors.gold[400], backgroundColor: Colors.gold[50], borderRadius: 6 },
});

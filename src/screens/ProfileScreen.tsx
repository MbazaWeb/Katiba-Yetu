import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Radius, Spacing, Typography } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../utils';

const FONT_SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const FONT_LABELS = ['A', 'A', 'A+', 'A++'] as const;

export function ProfileScreen({ onAuthPress }: { onAuthPress?: () => void }) {
  const { language, fontSize, setFontSize, user } = useAppContext();

  return (
    <View style={styles.root}>
      <AppHeader title={t('Akaunti', 'Profile', language)} variant="browser" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={Colors.green[200]} />
          </View>
          <Text style={styles.name}>{user ? user.display_name : t('Mwananchi', 'Citizen', language)}</Text>
          <Text style={styles.meta}>
            {user
              ? t(`Ameingia ${new Date(user.created_at).toLocaleDateString()}`, `Signed in ${new Date(user.created_at).toLocaleDateString()}`, language)
              : t('Ingia ili kuhifadhi michango na kura zako', 'Sign in to save your contributions and votes', language)}
          </Text>
          {!user && (
            <Pressable style={styles.primary} onPress={() => onAuthPress?.()}>
              <Text style={styles.primaryText}>
                {t('Ingia au jisajili', 'Sign in or register', language)}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>{t('USOMAJI', 'READING', language)}</Text>
        <View style={styles.panel}>
          <View style={styles.setting}>
            <View style={styles.settingIcon}>
              <Ionicons name="text" size={19} color={Colors.green[300]} />
            </View>
            <View style={styles.settingTextBlock}>
              <Text style={styles.settingTitle}>
                {t('Ukubwa wa maandishi', 'Text size', language)}
              </Text>
              <Text style={styles.settingSub}>
                {t('Badilisha ukubwa unaokufaa', 'Choose a comfortable reading size', language)}
              </Text>
            </View>
          </View>
          <View style={styles.segment}>
            {FONT_SIZES.map((size, i) => (
              <Pressable
                key={size}
                onPress={() => setFontSize(size)}
                style={[styles.segmentBtn, fontSize === size && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, fontSize === size && styles.segmentTextActive]}>
                  {FONT_LABELS[i]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.label}>{t('ZAIDI', 'MORE', language)}</Text>
        <View style={styles.panel}>
          <Menu icon="bookmark-outline" label={t('Ibara nilizohifadhi', 'Saved articles', language)} />
          <Menu icon="notifications-outline" label={t('Arifa', 'Notifications', language)} />
          <Menu icon="shield-checkmark-outline" label={t('Faragha na usalama', 'Privacy and security', language)} />
          <Menu icon="help-circle-outline" label={t('Msaada', 'Help', language)} last />
        </View>

        <Text style={styles.version}>Katiba Yetu · v0.2.0</Text>
      </ScrollView>
    </View>
  );
}

function Menu({
  icon, label, last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menu, !last && styles.menuBorder]}>
      <Ionicons name={icon} size={20} color={Colors.text.secondary} />
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[20],
  },
  profile: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green[900],
    borderWidth: 2,
    borderColor: Colors.green[700],
  },
  name: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[3],
  },
  meta: {
    fontSize: Typography.size.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing[1],
    maxWidth: 280,
  },
  primary: {
    backgroundColor: Colors.green[500],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    marginTop: Spacing[4],
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
    color: Colors.text.muted,
    marginTop: Spacing[5],
    marginBottom: Spacing[3],
  },
  panel: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    overflow: 'hidden',
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green[900],
  },
  settingTextBlock: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.text.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  settingSub: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    marginTop: 3,
  },
  segment: {
    flexDirection: 'row',
    margin: Spacing[3],
    marginTop: 0,
    padding: 3,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface.base,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentActive: {
    backgroundColor: Colors.green[700],
  },
  segmentText: {
    color: Colors.text.muted,
    fontWeight: Typography.weight.medium,
  },
  segmentTextActive: {
    color: '#fff',
  },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    minHeight: 54,
    paddingHorizontal: Spacing[4],
  },
  menuBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  menuText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.size.base,
  },
  version: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    marginTop: Spacing[8],
  },
});
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import {
  REGIONS, getRegion, getDistricts, localizedRegionName, localizedDistrictName,
  REGIONS_DISCLAIMER,
} from '../constants/regions';
import type { RegionEntry, DistrictEntry } from '../constants/regions';
import type { TanzaniaRegion } from '../types';

export interface RegionDistrictValue {
  region?: TanzaniaRegion;
  district?: string;
}

interface Props {
  value: RegionDistrictValue;
  onChange: (next: RegionDistrictValue) => void;
  /** Optional label override for the region field. */
  regionLabel?: string;
  /** Optional label override for the district field. */
  districtLabel?: string;
  /** Whether the picker is disabled (e.g. while submitting). */
  disabled?: boolean;
}

type PickerKind = 'region' | 'district' | null;

/**
 * Two-step location picker: Region → District.
 *
 * Behaviour:
 *  - The region picker lists all 31 Tanzania regions (mainland + Zanzibar).
 *  - Selecting a region resets the district so a stale district cannot be
 *    paired with a different region.
 *  - The district picker only opens after a region is chosen; districts are
 *    sourced from the `REGIONS` constant.
 *  - Selections are surfaced as chips with a clear button.
 *  - All interactive elements have `accessibilityRole`, `accessibilityLabel`,
 *    and `accessibilityState` for screen readers.
 */
export function RegionDistrictPicker({ value, onChange, regionLabel, districtLabel, disabled }: Props) {
  const { language } = useAppContext();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<PickerKind>(null);
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  const selectedRegion: RegionEntry | undefined = useMemo(() => getRegion(value.region), [value.region]);
  const districts: readonly DistrictEntry[] = useMemo(() => getDistricts(value.region), [value.region]);
  const selectedDistrict: DistrictEntry | undefined = useMemo(
    () => districts.find(d => d.id === value.district),
    [districts, value.district],
  );

  // Verify that the currently-stored district still belongs to the selected
  // region. If the region was changed elsewhere, the district becomes invalid.
  const districtIsStale = Boolean(value.district) && !districts.some(d => d.id === value.district);

  function chooseRegion(region: RegionEntry) {
    if (region.code === value.region) {
      // Re-selecting the same region just closes the picker.
      setOpen(null);
      return;
    }
    // Region changed: clear district to avoid mismatched pairs.
    onChange({ region: region.code, district: undefined });
    setOpen(null);
  }

  function chooseDistrict(district: DistrictEntry) {
    onChange({ region: value.region, district: district.id });
    setOpen(null);
  }

  function clearRegion() {
    onChange({ region: undefined, district: undefined });
  }

  function clearDistrict() {
    onChange({ region: value.region, district: undefined });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.fieldRow}>
        {/* Region field */}
        <View style={styles.field}>
          <Text style={styles.label}>{regionLabel ?? copy('Mkoa', 'Region')}</Text>
          <Pressable
            style={({ pressed }) => [styles.pickerBtn, pressed && styles.pickerBtnPressed, disabled && styles.pickerBtnDisabled]}
            onPress={() => !disabled && setOpen('region')}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === 'region', disabled: !!disabled }}
            accessibilityLabel={regionLabel ?? copy('Chagua mkoa', 'Select region')}
          >
            <Text style={styles.pickerBtnText} numberOfLines={1}>
              {selectedRegion ? localizedRegionName(selectedRegion, language) : copy('Chagua mkoa…', 'Select region…')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.text.muted} />
          </Pressable>
          {selectedRegion && (
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{localizedRegionName(selectedRegion, language)}</Text>
                <Pressable
                  onPress={clearRegion}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy('Futa mkoa', 'Clear region')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.text.muted} />
                </Pressable>
              </View>
              {selectedRegion.isZanzibar && <Text style={styles.zanzibarTag}>{copy('Unguja/Pemba', 'Zanzibar')}</Text>}
            </View>
          )}
        </View>

        {/* District field */}
        <View style={styles.field}>
          <Text style={styles.label}>{districtLabel ?? copy('Wilaya', 'District')}</Text>
          <Pressable
            style={({ pressed }) => [styles.pickerBtn, pressed && styles.pickerBtnPressed, (!selectedRegion || disabled) && styles.pickerBtnDisabled]}
            onPress={() => selectedRegion && !disabled && setOpen('district')}
            disabled={!selectedRegion || disabled}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === 'district', disabled: !selectedRegion || !!disabled }}
            accessibilityLabel={districtLabel ?? copy('Chagua wilaya', 'Select district')}
          >
            <Text style={[styles.pickerBtnText, !selectedRegion && styles.pickerBtnTextMuted]} numberOfLines={1}>
              {!selectedRegion
                ? copy('Chagua mkoa kwanza', 'Select a region first')
                : selectedDistrict
                  ? localizedDistrictName(selectedDistrict, language)
                  : copy('Chagua wilaya…', 'Select district…')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={selectedRegion ? Colors.text.muted : Colors.surface.borderStrong} />
          </Pressable>
          {selectedDistrict && (
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{localizedDistrictName(selectedDistrict, language)}</Text>
                <Pressable
                  onPress={clearDistrict}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy('Futa wilaya', 'Clear district')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.text.muted} />
                </Pressable>
              </View>
            </View>
          )}
          {districtIsStale && (
            <Text style={styles.staleWarning}>
              {copy('Wilaya iliyochaguliwa hailingani na mkoa uliopo. Tafadhali chagua tena.', 'The selected district does not belong to the current region. Please re-select.')}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.disclaimer}>{REGIONS_DISCLAIMER}</Text>

      {/* Picker modal — full list of regions or districts */}
      <Modal visible={open !== null} animationType="slide" transparent onRequestClose={() => setOpen(null)}>
        <View style={styles.scrim}>
          <Pressable style={styles.scrimDismiss} onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')} />
          <View style={[styles.sheet, { width: Math.min(width - 24, 480) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {open === 'region' ? copy('Chagua Mkoa', 'Select Region') : copy('Chagua Wilaya', 'Select District')}
              </Text>
              <Pressable onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}>
                <Ionicons name="close" size={24} color={Colors.text.muted} />
              </Pressable>
            </View>
            {open === 'region' ? (
              <ScrollView style={styles.list} contentContainerStyle={{ gap: 4, paddingBottom: Spacing[5] }} keyboardShouldPersistTaps="handled">
                {REGIONS.map(region => {
                  const active = region.code === value.region;
                  return (
                    <Pressable
                      key={region.code}
                      style={({ pressed }) => [styles.optionRow, active && styles.optionRowActive, pressed && { opacity: 0.7 }]}
                      onPress={() => chooseRegion(region)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={localizedRegionName(region, language)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionPrimary}>{localizedRegionName(region, language)}</Text>
                        <Text style={styles.optionSecondary}>
                          {region.districts.length} {copy('wilaya', 'districts')}
                          {region.isZanzibar ? ` · ${copy('Unguja/Pemba', 'Zanzibar')}` : ''}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView style={styles.list} contentContainerStyle={{ gap: 4, paddingBottom: Spacing[5] }} keyboardShouldPersistTaps="handled">
                {districts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{copy('Hakuna wilaya zilizosajiliwa kwa mkoa huu bado.', 'No districts registered for this region yet.')}</Text>
                  </View>
                ) : (
                  districts.map(district => {
                    const active = district.id === value.district;
                    return (
                      <Pressable
                        key={district.id}
                        style={({ pressed }) => [styles.optionRow, active && styles.optionRowActive, pressed && { opacity: 0.7 }]}
                        onPress={() => chooseDistrict(district)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={localizedDistrictName(district, language)}
                      >
                        <Text style={styles.optionPrimary}>{localizedDistrictName(district, language)}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing[2] },
  fieldRow: { flexDirection: 'row', gap: Spacing[3], flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 200, gap: Spacing[2] },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[3], minHeight: 48,
    borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md,
    backgroundColor: Colors.surface.overlay,
  },
  pickerBtnPressed: { borderColor: Colors.green[400] },
  pickerBtnDisabled: { opacity: 0.5 },
  pickerBtnText: { color: Colors.text.primary, fontSize: 16, flex: 1 },
  pickerBtnTextMuted: { color: Colors.text.muted },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4, paddingHorizontal: Spacing[2],
    backgroundColor: Colors.green[900], borderWidth: 1, borderColor: Colors.green[400],
    borderRadius: Radius.full,
  },
  chipText: { color: Colors.green[300], fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  zanzibarTag: { fontSize: Typography.size.xs, color: Colors.blue[300], fontStyle: 'italic' },
  staleWarning: { fontSize: Typography.size.xs, color: Colors.red[300], lineHeight: 18 },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, lineHeight: 17 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  scrimDismiss: { flex: 1 },
  sheet: {
    backgroundColor: Colors.surface.base,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    padding: Spacing[4],
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  list: { flex: 1 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[3], borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.surface.border, backgroundColor: Colors.surface.raised,
    minHeight: 52,
  },
  optionRowActive: { borderColor: Colors.green[400], backgroundColor: Colors.green[900] },
  optionPrimary: { color: Colors.text.primary, fontSize: Typography.size.md, fontWeight: Typography.weight.medium, flex: 1 },
  optionSecondary: { color: Colors.text.muted, fontSize: Typography.size.xs, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', maxWidth: 280 },
});

export default RegionDistrictPicker;

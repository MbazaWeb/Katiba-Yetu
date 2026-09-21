import React from 'react';
import { Text, View } from 'react-native';
import { useAppContext } from '../../hooks/useAppContext';
import { DISCLAIMER, getBundle, localized } from '../../services/constitution';
import type { ConstitutionArticle } from '../../types';
import { Action, Notice, libraryStyles as s } from './LibraryUI';

/**
 * Constitution-only MVP: automated clarification is deliberately disabled.
 * A future backend may render answers only after a verified legal expert has
 * authored or approved them and the response carries an identity/source badge.
 */
export function ClarificationPanel({
  article,
  onClose,
}: {
  article: ConstitutionArticle;
  onClose: () => void;
}) {
  const { language } = useAppContext();
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  return (
    <View style={[s.root, { padding: 16, gap: 12 }]}>
      <View style={s.row}>
        <Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>
          {copy('Ufafanuzi wa Katiba', 'Constitution clarification')}
        </Text>
        <Action label={copy('Funga', 'Close')} onPress={onClose} />
      </View>

      <Text style={s.small}>
        {localized(getBundle(article.documentId).document.title, language)} · {copy('Ibara', 'Article')} {article.number} · {article.source.documentVersion}
      </Text>
      <Text style={s.body}>{localized(article.title, language)}</Text>

      <Notice>
        {copy(
          'Majibu ya kiotomatiki yamezimwa. Ufafanuzi utaonyeshwa tu baada ya kuandikwa au kuthibitishwa na mtaalamu wa sheria aliyehakikiwa.',
          'Automated answers are disabled. Clarification will appear only after it is written or verified by a verified legal expert.',
        )}
      </Notice>

      <View style={s.card}>
        <Text style={s.heading}>{copy('Huduma inaandaliwa', 'Service in preparation')}</Text>
        <Text style={s.body}>
          {copy(
            'Jibu la baadaye lazima lionyeshe jina au taasisi ya mtaalamu, hadhi ya uthibitisho, tarehe, na chanzo cha Katiba kilichotumika.',
            'A future answer must show the expert or institution, verification status, date, and the constitutional source used.',
          )}
        </Text>
      </View>

      <Text style={s.small}>{DISCLAIMER}</Text>
    </View>
  );
}
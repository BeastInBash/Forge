import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

import { thumbnailUrl } from '../api';

/**
 * An exercise's image on a white tile (the artwork is drawn for a light ground), or a dumbbell
 * placeholder when it has none.
 */
export function ExerciseThumb({ url, size }: { url: string | null; size: number }) {
  const theme = useTheme();
  const clay = useClay();
  const frame = { width: size, height: size, borderRadius: size > 80 ? Radius.large : Radius.small + 4 };

  if (!url) {
    return (
      <View style={[styles.tile, frame, { backgroundColor: theme.background }, clay.sunken]}>
        <Icon ios="dumbbell" material="fitness_center" size={size * 0.4} color={theme.textSecondary} />
      </View>
    );
  }
  return (
    <Image
      source={thumbnailUrl(url, size)}
      style={[styles.tile, frame, { backgroundColor: '#FFFFFF' }]}
      contentFit="contain"
      // Thumbnails rarely change (a replaced image gets a new versioned URL), so keep them on disk.
      cachePolicy="memory-disk"
      transition={150}
      recyclingKey={url}
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

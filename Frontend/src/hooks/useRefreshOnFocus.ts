import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export const useRefreshOnFocus = (callback: () => void | Promise<void>): void => {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void callback();
    }, [callback]),
  );
};

import { useRef, useCallback, MouseEvent, FocusEvent } from 'react';

export function useSelectOnFirstFocus({ selectOnFocus = true }: { selectOnFocus?: boolean } = {}) {
  const hasFocusedRef = useRef(false);
  const ignoreNextMouseUp = useRef(false);

  const handleFocus = useCallback((event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectOnFocus && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      ignoreNextMouseUp.current = true; // the focus was triggered, next mouse up should not clear selection
      const target = event.currentTarget;
      requestAnimationFrame(() => {
        target.select();
      });
    }
  }, [selectOnFocus]);

  const handleBlur = useCallback(() => {
    hasFocusedRef.current = false;
    ignoreNextMouseUp.current = false;
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (ignoreNextMouseUp.current) {
      ignoreNextMouseUp.current = false;
      // Prevent the mouseup from clearing the selection that we just made in onFocus
      // Sometimes just selecting again here is safer if the browser cleared it.
      const target = event.currentTarget;
      requestAnimationFrame(() => {
        target.select();
      });
    }
  }, []);

  return { 
    onFocus: handleFocus, 
    onBlur: handleBlur,
    onMouseUp: handleMouseUp
  };
}

import { useEffect, useRef } from 'react';

/**
 * CursorEffects — custom cursor dot + trailing ring.
 *
 * PERF: All position updates are done via direct DOM manipulation
 * (transform style writes) instead of React state. This eliminates
 * the 60 fps setState → re-render cycle that was causing jank and
 * React reconciliation thrashing across the entire component tree.
 */
export default function CursorEffects() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;
    let isHovering = false;
    let isGrabbing = false;
    let visible = false;

    const updateClasses = () => {
      // Batch class updates into a single write per element
      const dotCls = `custom-cursor-dot${isHovering ? ' hovering' : ''}${isGrabbing ? ' grabbing' : ''}`;
      const ringCls = `custom-cursor-ring${isHovering ? ' hovering' : ''}${isGrabbing ? ' grabbing' : ''}`;
      dot.className = dotCls;
      ring.className = ringCls;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      // Position the dot immediately (no lerp)
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      // Check pointer state — avoid getComputedStyle (expensive).
      // Instead, rely on lightweight tag / attribute checks.
      const target = e.target as HTMLElement;
      const newHover =
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'A' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        document.body.style.cursor === 'pointer';

      if (newHover !== isHovering) {
        isHovering = newHover;
        updateClasses();
      }
    };

    const handleMouseDown = () => {
      if (!isGrabbing) {
        isGrabbing = true;
        updateClasses();
      }
    };

    const handleMouseUp = () => {
      if (isGrabbing) {
        isGrabbing = false;
        updateClasses();
      }
    };

    const handleMouseLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot" style={{ opacity: 0 }} />
      <div ref={ringRef} className="custom-cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}

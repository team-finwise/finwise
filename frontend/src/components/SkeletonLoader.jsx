/**
 * SkeletonLoader
 *
 * Renders pulse placeholders for loading states.
 */
export default function SkeletonLoader({ height = 20, width = '100%', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        ...style,
      }}
    />
  );
}

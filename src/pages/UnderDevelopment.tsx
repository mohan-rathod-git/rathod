/**
 * UnderDevelopment — Full-screen "Under Development" placeholder page
 *
 * Displays the branded Under Development PNG at its natural size.
 * Shown to non-admin users when a route is marked as under development
 * by the admin via the AdminUnderDevelopment panel.
 */

const UnderDevelopment = () => {
  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center"
      style={{ background: "#000", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Display the image at its natural/intrinsic size — protected from saving */}
      <img
        src="/under-development.png"
        alt="Under Development — Building Something Amazing. Stay Tuned! By Banjara Bandhan"
        style={{
          display: "block",
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
          pointerEvents: "none",
        } as React.CSSProperties}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default UnderDevelopment;

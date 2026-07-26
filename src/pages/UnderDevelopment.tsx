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
      style={{ background: "#000" }}
    >
      {/* Display the image at its natural/intrinsic size */}
      <img
        src="/under-development.png"
        alt="Under Development - Building Something Amazing. Stay Tuned! By Banjara Bandhan"
        style={{
          display: "block",
          maxWidth: "100%",
          // Use 'auto' to render at natural dimensions on desktop,
          // full-width on small screens
          width: "auto",
          height: "auto",
        }}
        draggable={false}
      />
    </div>
  );
};

export default UnderDevelopment;

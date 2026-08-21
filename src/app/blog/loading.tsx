export default function BlogLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="正在加载博客"
      className="blog-loading"
      id="main-content"
      tabIndex={-1}
    >
      <span />
      <span />
      <span />
    </main>
  );
}

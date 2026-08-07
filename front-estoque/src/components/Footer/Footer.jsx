export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-esquerda">
        <div className="footer-linha footer-empresa">
          <span>&copy; {new Date().getFullYear()} <a href="https://www.artrel.com.br/" target="_blank" rel="noopener noreferrer">ARTREL</a></span>
        </div>
        <div className="footer-linha footer-autor">
          <span>
            Desenvolvido por{' '}
            <a href="https://www.linkedin.com/in/diegolvalim/" target="_blank" rel="noopener noreferrer">
              Diego Luis Valim
            </a>
          </span>
        </div>
      </div>
      <span className="footer-versao">Protótipo v0.2</span>
    </footer>
  );
}
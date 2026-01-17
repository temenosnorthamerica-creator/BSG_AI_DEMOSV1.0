import styles from './Footer.module.scss'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.branding}>
            <h3 className={styles.title}>Banking Ecosystem Demo</h3>
            <p className={styles.description}>
              A comprehensive demonstration platform for banking solutions.
            </p>
          </div>
          <div className={styles.links}>
            <h4 className={styles.linksTitle}>Resources</h4>
            <ul className={styles.linksList}>
              <li>
                <a href="https://developer-portal.example.com" target="_blank" rel="noopener noreferrer">
                  Developer Portal
                </a>
              </li>
              <li>
                <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://support.example.com" target="_blank" rel="noopener noreferrer">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>
          <p>&copy; {currentYear} Banking Ecosystem. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

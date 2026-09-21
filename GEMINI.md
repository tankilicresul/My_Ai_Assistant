# Git & Workflow Rules

- **GitHub Repository**: `https://github.com/tankilicresul/My_Ai_Assistant.git`
- **Default Branch**: `main`
- **Rule**: Herhangi bir dosya eklendiğinde, güncellendiğinde veya silindiğinde yapılan değişiklikler hemen anlamlı bir commit mesajıyla commit edilip `git push origin main` ile uzak GitHub deposuna gönderilmelidir.
- **Git Ignore**: Hassas anahtarlar (`.env`), Python cache (`__pycache__`, `.pytest_cache`), sanal ortamlar (`.venv`, `venv`) ve geçici dosyalar depoya eklenmemelidir.

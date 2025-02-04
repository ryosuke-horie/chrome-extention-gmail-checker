// Gmail送信ボタンの監視
function watchGmailSendButton() {
    const observer = new MutationObserver((mutations) => {
        const sendButtons = document.querySelectorAll('[role="button"][data-tooltip-text*="送信"]');

        sendButtons.forEach(button => {
            if (!button.hasListener) {
                button.hasListener = true;
                button.addEventListener('click', interceptSend);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 送信をインターセプトする関数
function interceptSend(event) {
    event.preventDefault();
    event.stopPropagation();

    // メールの情報を取得
    const emailInfo = {
        to: getRecipients(),
        subject: getSubject(),
        body: getEmailBody()
    };

    // 確認ポップアップを表示
    showConfirmationPopup(emailInfo);
}

// メール情報取得用の補助関数
function getRecipients() {
    const recipients = {
        to: [],
        cc: [],
        bcc: []
    };

    // To フィールド
    const toField = document.querySelector('div[aria-label="宛先"]');
    if (toField) {
        recipients.to = Array.from(toField.querySelectorAll('span[email]'))
            .map(span => span.getAttribute('email'));
    }

    // Cc フィールド
    const ccField = document.querySelector('div[aria-label="Cc"]');
    if (ccField) {
        recipients.cc = Array.from(ccField.querySelectorAll('span[email]'))
            .map(span => span.getAttribute('email'));
    }

    // Bcc フィールド
    const bccField = document.querySelector('div[aria-label="Bcc"]');
    if (bccField) {
        recipients.bcc = Array.from(bccField.querySelectorAll('span[email]'))
            .map(span => span.getAttribute('email'));
    }

    return {
        to: recipients.to.join(', '),
        cc: recipients.cc.join(', '),
        bcc: recipients.bcc.join(', ')
    };
}

function getSubject() {
    const subjectInput = document.querySelector('input[name="subjectbox"]');
    return subjectInput ? subjectInput.value : '（件名なし）';
}

function getEmailBody() {
    const editorBody = document.querySelector('div[role="textbox"][aria-label*="本文"]');
    return editorBody ? editorBody.innerHTML : '';
}

// 確認ポップアップを表示する関数
function showConfirmationPopup(emailInfo) {
    const popup = document.createElement('div');
    popup.className = 'gmail-checker-popup';
    popup.innerHTML = `
    <div class="popup-content">
      <h2>送信前確認</h2>
      <div class="email-info">
        <p><strong>To:</strong> ${emailInfo.to.to || '（なし）'}</p>
        ${emailInfo.to.cc ? `<p><strong>Cc:</strong> ${emailInfo.to.cc}</p>` : ''}
        ${emailInfo.to.bcc ? `<p><strong>Bcc:</strong> ${emailInfo.to.bcc}</p>` : ''}
        <p><strong>件名:</strong> ${emailInfo.subject}</p>
        <p><strong>本文:</strong></p>
        <div class="email-body">${emailInfo.body}</div>
      </div>
      <div class="confirmation">
        <label>
          <input type="checkbox" id="confirmCheck"> 
          内容を確認しました
        </label>
      </div>
      <div class="buttons">
        <button id="cancelSend">キャンセル</button>
        <button id="confirmSend" disabled>送信</button>
      </div>
    </div>
  `;

    document.body.appendChild(popup);

    // イベントリスナーの追加
    const confirmCheck = popup.querySelector('#confirmCheck');
    const confirmSendButton = popup.querySelector('#confirmSend');
    const cancelSendButton = popup.querySelector('#cancelSend');

    confirmCheck.addEventListener('change', (e) => {
        confirmSendButton.disabled = !e.target.checked;
    });

    cancelSendButton.addEventListener('click', () => {
        popup.remove();
    });

    confirmSendButton.addEventListener('click', () => {
        popup.remove();
        executeSend();
    });
}

// 実際の送信を実行する関数
function executeSend() {
    const sendButton = document.querySelector('[role="button"][data-tooltip-text*="送信"]');
    if (sendButton) {
        // イベントリスナーを一時的に削除
        sendButton.removeEventListener('click', interceptSend);
        // クリックイベントを発火
        sendButton.click();
        // イベントリスナーを再追加
        setTimeout(() => {
            sendButton.addEventListener('click', interceptSend);
        }, 100);
    }
}

// キーボードショートカットの監視
function watchKeyboardShortcuts() {
    document.addEventListener('keydown', function (event) {
        // Ctrl+Enter または Cmd+Enter (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            const composerBox = document.querySelector('div[role="dialog"][aria-label*="メールを作成"]');
            if (composerBox) {
                event.preventDefault();
                event.stopPropagation();
                interceptSend(event);
            }
        }
    }, true);
}

// 拡張機能の初期化を更新
function initializeExtension() {
    watchGmailSendButton();
    watchKeyboardShortcuts();
}

// DOMContentLoadedイベントリスナーを更新
document.addEventListener('DOMContentLoaded', initializeExtension); 
// Gmail送信ボタンの監視
function watchGmailSendButton() {
    const observer = new MutationObserver((mutations) => {
        const sendButtons = document.querySelectorAll('div[role="button"][data-tooltip*="送信"]');

        sendButtons.forEach(button => {
            if (!button.hasListener) {
                button.hasListener = true;
                // クリックイベントの代わりにmousedownイベントを使用
                button.addEventListener('mousedown', interceptSend, true);
                // 追加の保険としてclickイベントも監視
                button.addEventListener('click', interceptSend, true);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['role', 'data-tooltip']
    });
}

// 送信をインターセプトする関数を更新
function interceptSend(event) {
    // 即座にイベントをキャンセル
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // メールの情報を取得
    const emailInfo = {
        to: getRecipients(),
        subject: getSubject(),
        body: getEmailBody()
    };

    // 確認ポップアップを表示
    showConfirmationPopup(emailInfo);

    return false;
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
        // 送信ボタンを無効化して二重送信を防止
        confirmSendButton.disabled = true;
        // ポップアップを閉じる
        popup.remove();
        // 少し遅延してから送信を実行
        setTimeout(executeSend, 100);
    });
}

// 実際の送信を実行する関数を更新
function executeSend() {
    const sendButton = document.querySelector('div[role="button"][data-tooltip*="送信"]');
    if (sendButton) {
        // 元のイベントリスナーを一時的に削除
        sendButton.removeEventListener('mousedown', interceptSend, true);
        sendButton.removeEventListener('click', interceptSend, true);

        // Gmail独自の送信処理をトリガー
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        // mousedownとclickの両方のイベントを発火
        sendButton.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        // クリックイベントを少し遅延して発火
        setTimeout(() => {
            sendButton.dispatchEvent(clickEvent);
        }, 50);

        // イベントリスナーを再追加
        setTimeout(() => {
            sendButton.addEventListener('mousedown', interceptSend, true);
            sendButton.addEventListener('click', interceptSend, true);
        }, 500);
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

// 初期化関数も更新
function initializeExtension() {
    console.log('Gmail Checker 初期化開始');

    // 即時実行の追加
    const sendButtons = document.querySelectorAll('div[role="button"][data-tooltip*="送信"]');
    sendButtons.forEach(button => {
        if (!button.hasListener) {
            button.hasListener = true;
            button.addEventListener('mousedown', interceptSend, true);
            button.addEventListener('click', interceptSend, true);
        }
    });

    watchGmailSendButton();
    watchKeyboardShortcuts();
}

// DOMContentLoadedの代わりにloadイベントを使用
window.addEventListener('load', initializeExtension);

// 定期チェックも更新
setInterval(() => {
    const sendButtons = document.querySelectorAll('div[role="button"][data-tooltip*="送信"]');
    sendButtons.forEach(button => {
        if (!button.hasListener) {
            button.hasListener = true;
            button.addEventListener('mousedown', interceptSend, true);
            button.addEventListener('click', interceptSend, true);
        }
    });
}, 2000); 
// 既存の送信ボタンを非表示にし、確認ボタンを挿入する関数
function replaceSendButton() {
    // Gmail の送信ボタンを取得（複数存在する場合に備えて最初の要素を対象とする例）
    const sendButton = document.querySelector('div[role="button"][data-tooltip*="送信"]');
    if (!sendButton) return;

    // 既にカスタムボタンが設置済みの場合は何もしない
    if (document.querySelector('.gmail-confirm-button')) return;

    // 元の送信ボタンは Gmail の内部処理と連携しているため、隠す（非表示にする）
    sendButton.style.display = 'none';

    // 元ボタンの親要素にカスタムボタンを挿入する（位置調整は必要に応じてCSSで）
    const confirmButton = document.createElement('button');
    confirmButton.className = 'gmail-confirm-button';
    confirmButton.textContent = '確認';

    // Gmail の UI に合わせたスタイルを適用（ここでは背景色、文字色、パディング、角丸を指定）
    Object.assign(confirmButton.style, {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        backgroundColor: '#008000',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        outline: 'none'
    });

    // 送信処理のインターセプト：クリック時にポップアップを表示
    confirmButton.addEventListener('click', (event) => {
        event.preventDefault();

        const recipients = getRecipients();
        const emailInfo = {
            to: recipients.to,
            cc: recipients.cc,
            bcc: recipients.bcc,
            subject: getSubject(),
            body: getEmailBody()
        };

        // 確認ダイアログの内容を作成
        const dialogContent = `
            <div style="margin-bottom: 15px;">
                <strong>以下の内容で送信してよろしいですか？</strong>
            </div>
            <div style="margin-bottom: 10px;">
                <div><strong>宛先:</strong> ${emailInfo.to.join(', ') || '(なし)'}</div>
                <div><strong>CC:</strong> ${emailInfo.cc.join(', ') || '(なし)'}</div>
                <div><strong>BCC:</strong> ${emailInfo.bcc.join(', ') || '(なし)'}</div>
                <div><strong>件名:</strong> ${emailInfo.subject}</div>
            </div>
        `;

        // モーダルダイアログを表示
        showConfirmDialog(dialogContent, () => {
            sendButton.click(); // OKクリック時は元の送信ボタンをクリック
        });
    });

    // 元の送信ボタンと同じ親要素にカスタムボタンを追加
    sendButton.parentNode.insertBefore(confirmButton, sendButton.nextSibling);
}


// メールの宛先情報を取得する関数
function getRecipients() {
    const recipients = {
        to: [],
        cc: [],
        bcc: []
    };

    // 新しいGmailのPeopleKit UIを使用している場合
    const peopleKitUI = document.querySelector('div[name=to] input[peoplekit-id]');

    if (peopleKitUI) {
        // To
        document.querySelectorAll('div[name=to] div[data-hovercard-id]').forEach(el => {
            recipients.to.push(el.getAttribute('data-hovercard-id'));
        });
        // CC
        document.querySelectorAll('div[name=cc] div[data-hovercard-id]').forEach(el => {
            recipients.cc.push(el.getAttribute('data-hovercard-id'));
        });
        // BCC
        document.querySelectorAll('div[name=bcc] div[data-hovercard-id]').forEach(el => {
            recipients.bcc.push(el.getAttribute('data-hovercard-id'));
        });
    } else {
        // 従来のGmail UI
        // To
        document.querySelectorAll('input[name="to"]').forEach(el => {
            recipients.to.push(el.value);
        });
        // CC
        document.querySelectorAll('input[name="cc"]').forEach(el => {
            recipients.cc.push(el.value);
        });
        // BCC
        document.querySelectorAll('input[name="bcc"]').forEach(el => {
            recipients.bcc.push(el.value);
        });
    }

    return recipients;
}

// 件名取得用関数
function getSubject() {
    return document.querySelector('input[name="subjectbox"]')?.value ||
        document.querySelector('input[name="subject"]')?.value ||
        '(件名なし)';
}

// 本文取得用関数
function getEmailBody() {
    return document.querySelector('[contenteditable="true"]')?.innerHTML || '';
}

// 確認ポップアップを表示する関数
// confirmCallback に、確認後の送信処理（元の送信処理のトリガー）を渡す
function showConfirmationPopup(emailInfo, confirmCallback) {
    // 既存のポップアップがあれば除去
    const existingPopup = document.querySelector('.gmail-checker-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.className = 'gmail-checker-popup';
    popup.innerHTML = `
    <div class="popup-content">
      <h2>送信前確認</h2>
      <div class="email-info">
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
    // スタイルは必要に応じて追加してください（例：固定表示、背景の半透明オーバーレイなど）
    Object.assign(popup.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '10000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    });
    document.body.appendChild(popup);

    // 各ボタンのイベント設定
    const confirmCheck = popup.querySelector('#confirmCheck');
    const confirmSendButton = popup.querySelector('#confirmSend');
    const cancelSendButton = popup.querySelector('#cancelSend');

    // チェックボックスの変更で送信ボタンの有効化／無効化
    confirmCheck.addEventListener('change', (e) => {
        confirmSendButton.disabled = !e.target.checked;
    });

    // キャンセル時はポップアップを閉じる
    cancelSendButton.addEventListener('click', () => {
        popup.remove();
    });

    // 送信確定時の処理
    confirmSendButton.addEventListener('click', () => {
        confirmSendButton.disabled = true;
        popup.remove();
        confirmCallback();
    });
}

// 元の送信ボタンに対してクリックイベントをシミュレートする関数
// 送信ボタン（非表示になっている元のボタン）を引数として受け取る
function executeSend(originalSendButton) {
    if (originalSendButton) {
        // Gmail 独自の送信処理をトリガーするため、元のボタンに対してイベントを発火
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        originalSendButton.dispatchEvent(clickEvent);
    }
}

// 送信ボタンの変化を監視し、カスタムの確認ボタンを設置する関数
function watchSendButton() {
    const observer = new MutationObserver((mutations) => {
        // Gmail の送信ボタンが再描画された場合に対応するため
        replaceSendButton();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// 初期化関数
function initializeExtension() {
    console.log('Gmail Checker 初期化開始');
    replaceSendButton();
    watchSendButton();
}

// ページのロード完了後に初期化
window.addEventListener('load', initializeExtension);

// モーダルダイアログを表示する関数
function showConfirmDialog(content, onOk) {
    // モーダルの背景を作成
    const modalBackground = document.createElement('div');
    modalBackground.className = 'gmail-modal-background';
    modalBackground.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
    `;

    // モーダルウィンドウを作成
    const modalWindow = document.createElement('div');
    modalWindow.className = 'gmail-modal-window';
    modalWindow.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        min-width: 300px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
    `;

    // コンテンツを追加
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content;
    contentDiv.style.marginBottom = '20px';

    // 本文表示エリアを追加
    const bodyDiv = document.createElement('div');
    bodyDiv.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        background: #f8f9fa;
    `;
    bodyDiv.innerHTML = getEmailBody();

    // ボタンコンテナ
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    `;

    // OKボタン
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
        padding: 8px 16px;
        background: #1a73e8;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    // キャンセルボタン
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'キャンセル';
    cancelButton.style.cssText = `
        padding: 8px 16px;
        background: #f1f3f4;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    // イベントリスナーを追加
    okButton.addEventListener('click', () => {
        document.body.removeChild(modalBackground);
        if (onOk) onOk();
    });

    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalBackground);
    });

    // 要素を組み立て
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);
    modalWindow.appendChild(contentDiv);
    modalWindow.appendChild(bodyDiv);
    modalWindow.appendChild(buttonContainer);
    modalBackground.appendChild(modalWindow);

    // DOMに追加
    document.body.appendChild(modalBackground);
}

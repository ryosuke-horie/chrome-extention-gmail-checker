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
        // メール情報の取得（各要素が正しく取得できるかは実際のDOMに合わせて調整）
        const emailInfo = {
            subject: getSubject(),
            body: getEmailBody(),
        };
        showConfirmationPopup(emailInfo, () => {
            // ユーザが確認して送信を確定した場合、元の送信処理を実行
            executeSend(sendButton);
        });
    });

    // 元の送信ボタンと同じ親要素にカスタムボタンを追加
    sendButton.parentNode.insertBefore(confirmButton, sendButton.nextSibling);
}


// 件名取得用関数
function getSubject() {
    const subjectInput = document.querySelector('input[name="subjectbox"]');
    return subjectInput ? subjectInput.value : '（件名なし）';
}

// 本文取得用関数
function getEmailBody() {
    const editorBody = document.querySelector('div[role="textbox"][aria-label*="本文"]');
    return editorBody ? editorBody.innerHTML : '';
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

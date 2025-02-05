// Gmail送信ボタンの監視（DOM変化に応じて動的にイベントリスナーを追加）
function watchGmailSendButton() {
	const observer = new MutationObserver((mutations) => {
		const sendButtons = document.querySelectorAll(
			'div[role="button"][data-tooltip*="送信"]',
		);
		sendButtons.forEach((button) => {
			if (!button.hasListener) {
				button.hasListener = true;
				// mousedownとclickイベントの両方で送信処理をインターセプト
				button.addEventListener("mousedown", interceptSend, true);
				button.addEventListener("click", interceptSend, true);
			}
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["role", "data-tooltip"],
	});
}

// 送信処理をインターセプトする関数
function interceptSend(event) {
	// 既定の送信動作を即座にキャンセル
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();

	// メール情報の取得（宛先取得処理は削除）
	const emailInfo = {
		subject: getSubject(),
		body: getEmailBody(),
	};

	// 確認ポップアップの表示
	showConfirmationPopup(emailInfo);
	return false;
}

// 件名取得用関数
function getSubject() {
	const subjectInput = document.querySelector('input[name="subjectbox"]');
	return subjectInput ? subjectInput.value : "（件名なし）";
}

// 本文取得用関数
function getEmailBody() {
	const editorBody = document.querySelector(
		'div[role="textbox"][aria-label*="本文"]',
	);
	return editorBody ? editorBody.innerHTML : "";
}

// 確認ポップアップを表示する関数
function showConfirmationPopup(emailInfo) {
	const popup = document.createElement("div");
	popup.className = "gmail-checker-popup";
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
	document.body.appendChild(popup);

	// 各ボタンのイベント設定
	const confirmCheck = popup.querySelector("#confirmCheck");
	const confirmSendButton = popup.querySelector("#confirmSend");
	const cancelSendButton = popup.querySelector("#cancelSend");

	// チェックボックスの変更で送信ボタンの有効化／無効化
	confirmCheck.addEventListener("change", (e) => {
		confirmSendButton.disabled = !e.target.checked;
	});

	// キャンセル時はポップアップを閉じる
	cancelSendButton.addEventListener("click", () => {
		popup.remove();
	});

	// 送信確定時の処理
	confirmSendButton.addEventListener("click", () => {
		// 送信ボタンの二重送信防止のため一時的に無効化
		confirmSendButton.disabled = true;
		popup.remove();
		// 少し遅延してから実際の送信を実行
		setTimeout(executeSend, 100);
	});
}

// 実際の送信処理を実行する関数
function executeSend() {
	const sendButton = document.querySelector(
		'div[role="button"][data-tooltip*="送信"]',
	);
	if (sendButton) {
		// イベントリスナーを一旦削除
		sendButton.removeEventListener("mousedown", interceptSend, true);
		sendButton.removeEventListener("click", interceptSend, true);

		// Gmail独自の送信処理をトリガーするためのイベントを生成
		const clickEvent = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window,
		});

		// mousedownイベントの発火
		sendButton.dispatchEvent(
			new MouseEvent("mousedown", {
				bubbles: true,
				cancelable: true,
				view: window,
			}),
		);

		// 少し遅延してからclickイベントを発火
		setTimeout(() => {
			sendButton.dispatchEvent(clickEvent);
		}, 50);

		// 数百ミリ秒後に再度イベントリスナーを追加
		setTimeout(() => {
			sendButton.addEventListener("mousedown", interceptSend, true);
			sendButton.addEventListener("click", interceptSend, true);
		}, 500);
	}
}

// 初期化関数
function initializeExtension() {
	console.log("Gmail Checker 初期化開始");

	// 既存の送信ボタンに対してイベントリスナーを設定
	const sendButtons = document.querySelectorAll(
		'div[role="button"][data-tooltip*="送信"]',
	);
	sendButtons.forEach((button) => {
		if (!button.hasListener) {
			button.hasListener = true;
			button.addEventListener("mousedown", interceptSend, true);
			button.addEventListener("click", interceptSend, true);
		}
	});

	watchGmailSendButton();
}

// ページのロード完了後に初期化
window.addEventListener("load", initializeExtension);

// 定期的に送信ボタンの監視を実施（動的に追加されたボタンへの対応）
setInterval(() => {
	const sendButtons = document.querySelectorAll(
		'div[role="button"][data-tooltip*="送信"]',
	);
	sendButtons.forEach((button) => {
		if (!button.hasListener) {
			button.hasListener = true;
			button.addEventListener("mousedown", interceptSend, true);
			button.addEventListener("click", interceptSend, true);
		}
	});
}, 2000);

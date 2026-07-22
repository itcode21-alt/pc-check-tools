/**
 * 사용자 피드백 시스템
 *
 * 목적:
 * - 진단 결과, 계산기 결과의 정확도 피드백 수집
 * - 개인정보 저장 동의와 분리 (GDPR, 개인정보보호법 준수)
 * - 월간 리뷰를 통한 콘텐츠 개선
 *
 * 사용법:
 *   const feedback = new FeedbackSystem();
 *   feedback.showDialog("diagnostic", "CPU와 메인보드 호환성 검사", "accurate");
 */

class FeedbackSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || "itsvc_feedback";
    this.serverEndpoint = options.serverEndpoint || "/api/feedback";
    this.maxLocalFeedback = options.maxLocalFeedback || 50;
    this.feedbacks = this.loadFeedbacks();
  }

  /**
   * 피드백 다이얼로그 표시
   * @param {string} type - 피드백 타입 (diagnostic, calculator, guide, etc)
   * @param {string} context - 피드백 컨텍스트 (예: "CPU와 메인보드 호환성")
   * @param {function} onSubmit - 제출 콜백
   */
  showDialog(type, context, onSubmit) {
    const dialogHtml = `
      <div class="feedback-overlay" id="feedbackOverlay">
        <div class="feedback-dialog">
          <div class="feedback-header">
            <h3>이 결과가 도움이 되었나요?</h3>
            <button class="close-btn" onclick="document.getElementById('feedbackOverlay').remove()">✕</button>
          </div>

          <div class="feedback-content">
            <p class="feedback-context">${this.escapeHtml(context)}</p>

            <div class="feedback-buttons">
              <button class="btn btn-feedback-yes" onclick="window.feedbackSystem && window.feedbackSystem.submit('${type}', '${context}', 'helpful')">
                👍 도움이 됨
              </button>
              <button class="btn btn-feedback-no" onclick="window.feedbackSystem && window.feedbackSystem.submit('${type}', '${context}', 'unhelpful')">
                👎 도움이 안 됨
              </button>
            </div>

            <div class="feedback-optional">
              <p style="font-size: 12px; color: #666;">
                <input type="checkbox" id="feedbackConsent" />
                <label for="feedbackConsent">
                  상세한 피드백을 남기고 싶습니다 (선택사항)
                </label>
              </p>
            </div>

            <div id="feedbackDetails" style="display: none; margin-top: 15px;">
              <textarea
                id="feedbackText"
                placeholder="어떤 부분이 부정확했나요?"
                maxlength="500"
                rows="4"
                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"
              ></textarea>
              <p style="font-size: 11px; color: #999; margin: 5px 0;">
                개인정보는 수집하지 않습니다. 텍스트만 저장됩니다.
              </p>
            </div>
          </div>

          <div class="feedback-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('feedbackOverlay').remove()">
              닫기
            </button>
            <button class="btn btn-primary" id="feedbackSubmitBtn" style="display: none;">
              피드백 제출
            </button>
          </div>
        </div>
      </div>

      <style>
        .feedback-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .feedback-dialog {
          background: white;
          border-radius: 8px;
          padding: 25px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .feedback-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
        }

        .feedback-context {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-size: 13px;
          color: #666;
          margin: 0 0 15px 0;
        }

        .feedback-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .btn-feedback-yes,
        .btn-feedback-no {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-feedback-yes:hover {
          background: #d4edda;
          border-color: #28a745;
        }

        .btn-feedback-no:hover {
          background: #f8d7da;
          border-color: #dc3545;
        }

        .feedback-optional {
          margin: 15px 0;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .feedback-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn {
          padding: 8px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #e9ecef;
          color: #333;
        }

        .btn-secondary:hover {
          background: #dee2e6;
        }
      </style>
    `;

    // DOM에 추가
    const container = document.createElement("div");
    container.innerHTML = dialogHtml;
    document.body.appendChild(container.firstChild);

    // 상세 피드백 토글
    const checkbox = document.getElementById("feedbackConsent");
    const details = document.getElementById("feedbackDetails");
    const submitBtn = document.getElementById("feedbackSubmitBtn");

    checkbox.addEventListener("change", () => {
      details.style.display = checkbox.checked ? "block" : "none";
      submitBtn.style.display = checkbox.checked ? "block" : "none";
    });

    // 제출 버튼
    submitBtn.addEventListener("click", () => {
      const text = document.getElementById("feedbackText").value;
      this.submit(type, context, "detailed", text);
      document.getElementById("feedbackOverlay").remove();
    });
  }

  /**
   * 피드백 제출
   * @param {string} type - 피드백 타입
   * @param {string} context - 피드백 컨텍스트
   * @param {string} rating - 평가 (helpful, unhelpful, detailed)
   * @param {string} text - 상세 피드백 텍스트 (선택)
   */
  async submit(type, context, rating, text = "") {
    const feedback = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      context: context,
      rating: rating,
      text: text || "",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.pathname
    };

    // 로컬 저장
    this.feedbacks.push(feedback);
    if (this.feedbacks.length > this.maxLocalFeedback) {
      this.feedbacks.shift();
    }
    this.saveFeedbacks();

    // 서버 전송 (선택)
    if (text || rating === "helpful" || rating === "unhelpful") {
      this.sendToServer(feedback);
    }

    console.log("✓ 피드백이 저장되었습니다.");
  }

  /**
   * 서버로 피드백 전송
   */
  async sendToServer(feedback) {
    try {
      const response = await fetch(this.serverEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        console.warn("피드백 전송 실패:", response.status);
      }
    } catch (error) {
      console.warn("피드백 전송 오류:", error);
      // 실패해도 사용자에게 알리지 않음
    }
  }

  /**
   * 로컬 저장소에서 피드백 로드
   */
  loadFeedbacks() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn("피드백 로드 오류:", error);
      return [];
    }
  }

  /**
   * 로컬 저장소에 피드백 저장
   */
  saveFeedbacks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.feedbacks));
    } catch (error) {
      console.warn("피드백 저장 오류:", error);
    }
  }

  /**
   * 피드백 통계
   */
  getStatistics() {
    const stats = {
      total: this.feedbacks.length,
      helpful: 0,
      unhelpful: 0,
      detailed: 0,
      byType: {},
      lastSubmit: null
    };

    this.feedbacks.forEach((feedback) => {
      if (feedback.rating === "helpful") stats.helpful++;
      else if (feedback.rating === "unhelpful") stats.unhelpful++;
      else if (feedback.rating === "detailed") stats.detailed++;

      if (!stats.byType[feedback.type]) stats.byType[feedback.type] = 0;
      stats.byType[feedback.type]++;

      if (!stats.lastSubmit || new Date(feedback.timestamp) > new Date(stats.lastSubmit)) {
        stats.lastSubmit = feedback.timestamp;
      }
    });

    return stats;
  }

  /**
   * 오래된 피드백 삭제 (6개월 이상)
   */
  cleanOldFeedbacks(monthsOld = 6) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    this.feedbacks = this.feedbacks.filter(
      (feedback) => new Date(feedback.timestamp) > cutoffDate
    );

    this.saveFeedbacks();
    return this.feedbacks.length;
  }

  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// 글로벌 인스턴스
window.feedbackSystem = new FeedbackSystem();

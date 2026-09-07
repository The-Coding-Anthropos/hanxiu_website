async function getSiteData() {
  const response = await fetch("/api/site-data");
  return response.json();
}

function formatPrice(value) {
  return `¥${Number(value).toLocaleString("zh-CN")}`;
}

function productCard(item) {
  const specs = item.specs.map((spec) => `<span class="tag">${spec}</span>`).join("");
  const detailImages = Array.isArray(item.detailImages) ? item.detailImages : [];
  const detailLinks = detailImages
    .map((url, index) => `<a href="${url}" target="_blank" rel="noopener noreferrer">细节图 ${index + 1}</a>`)
    .join(" | ");
  const options = item.specs.map((spec) => `<option value="${spec}">${spec}</option>`).join("");
  return `
    <article class="card">
      <img src="${item.image}" alt="${item.name}" loading="lazy" />
      <div class="card-body">
        <h3>${item.name}</h3>
        <p class="meta">类目：${item.category}</p>
        <div class="tags">${specs}</div>
        ${detailLinks ? `<p class="meta">${detailLinks}</p>` : ""}
        <p><strong>${formatPrice(item.price)}</strong> + 运费 ${formatPrice(item.shippingFee)}</p>
        <div class="product-actions">
          <label>规格
            <select data-field="spec">${options}</select>
          </label>
          <label>数量
            <input data-field="quantity" type="number" min="1" value="1" />
          </label>
        </div>
        <div class="cta-row">
          <button class="btn btn-primary" data-action="contact-buy" data-product-id="${item.id}">联系管理员付款</button>
        </div>
      </div>
    </article>
  `;
}

function jumpToContactBuy(product, spec, quantity) {
  const query = new URLSearchParams({
    type: "商城购买",
    product: product.name,
    spec,
    quantity: String(Math.max(1, Number(quantity) || 1))
  });
  window.location.href = `/booking.html?${query.toString()}`;
}

function workCard(item, showInquiryButton = true) {
  const detailImages = Array.isArray(item.detailImages)
    ? item.detailImages
    : item.detail
      ? [item.detail]
      : [];
  const detailLinks = detailImages
    .map((url, index) => `<a href="${url}" target="_blank" rel="noopener noreferrer">细节图 ${index + 1}</a>`)
    .join(" | ");

  return `
    <article class="card">
      <img src="${item.cover}" alt="${item.title}" loading="lazy" />
      <div class="card-body">
        <h3>${item.title} <span class="pill">${item.category}</span></h3>
        <p class="meta">尺寸：${item.size} | 材质：${item.material}</p>
        <p class="meta">收藏价值：${item.value}</p>
        <details>
          <summary>查看细节与视频</summary>
          <p>${item.description}</p>
          <p>${detailLinks || "暂无细节图"}${item.video ? ` | <a href="${item.video}" target="_blank" rel="noopener noreferrer">创作视频</a>` : ""}</p>
        </details>
        ${showInquiryButton ? `<button class="btn btn-outline" data-custom-title="${item.title}">询价定制</button>` : ""}
      </div>
    </article>
  `;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

function bindInquiryForm(defaultType) {
  const form = document.querySelector("#inquiryForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      message: formData.get("message"),
      type: formData.get("type") || defaultType
    };
    const result = await postJson("/api/inquiries", payload);
    document.querySelector("#inquiryMsg").textContent = result.message || "提交完成";
    form.reset();
  });
}

function bindDynamicActions(data) {
  const worksPanel = document.querySelector("#worksGrid");
  if (worksPanel) {
    worksPanel.addEventListener("click", (event) => {
      const target = event.target;
      if (target.matches("button[data-custom-title]")) {
        window.location.href = "/about.html";
      }
    });
  }

  const productsPanel = document.querySelector("#productsGrid");
  if (productsPanel) {
    productsPanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!target.matches("button[data-product-id]")) {
        return;
      }

      const productId = target.getAttribute("data-product-id");
      const product = data.content.products.find((item) => item.id === productId);
      if (!product) {
        return;
      }

      const card = target.closest(".card");
      const spec = card?.querySelector("select[data-field='spec']")?.value || product.specs[0];
      const quantity = Number(card?.querySelector("input[data-field='quantity']")?.value) || 1;
      if (target.matches("button[data-action='contact-buy']")) {
        jumpToContactBuy(product, spec, quantity);
      }
    });
  }
}

function bindBookingPrefill() {
  const form = document.querySelector("#inquiryForm");
  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const product = params.get("product");
  const spec = params.get("spec");
  const quantity = params.get("quantity");

  if (type) {
    const typeInput = form.querySelector("[name='type']");
    if (typeInput) {
      typeInput.value = type;
    }
  }

  if (product) {
    const messageInput = form.querySelector("[name='message']");
    if (messageInput && !messageInput.value.trim()) {
      const specText = spec || "默认规格";
      const qtyText = quantity || "1";
      messageInput.value = `我想购买：${product}\n规格：${specText}\n数量：${qtyText}\n请联系我确认付款方式与发货安排。`;
    }
  }
}

function renderHome(data) {
  const home = data.content.home;
  const works = data.content.works.filter((item) => home.featuredWorkIds.includes(item.id));

  const heroTitle = document.querySelector("#heroTitle");
  const heroSubtitle = document.querySelector("#heroSubtitle");
  const featuredWorks = document.querySelector("#featuredWorks");
  const story = document.querySelector("#storyText");

  if (heroTitle) heroTitle.textContent = home.bannerTitle;
  if (heroSubtitle) heroSubtitle.textContent = home.bannerSubtitle;
  if (featuredWorks) featuredWorks.innerHTML = works.map((item) => workCard(item, false)).join("");
  if (story) story.textContent = home.story;
}

function renderGallery(data) {
  const panel = document.querySelector("#worksGrid");
  if (panel) {
    panel.innerHTML = data.content.works.map(workCard).join("");
  }
}

function renderShop(data) {
  const panel = document.querySelector("#productsGrid");
  if (panel) {
    panel.innerHTML = data.content.products.map(productCard).join("");
  }
}

function renderKnowledge(data) {
  const panel = document.querySelector("#knowledgeGrid");
  if (!panel) {
    return;
  }

  panel.innerHTML = data.content.knowledge
    .map((item) => {
      const tags = item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
      return `
        <article class="card">
          <div class="card-body">
            <h3>${item.title}</h3>
            <div class="tags">${tags}</div>
            <p class="meta">${item.summary}</p>
            <a class="btn btn-outline" href="/knowledge-detail.html?id=${encodeURIComponent(item.id)}">阅读全文</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderKnowledgeDetail(data) {
  const titleEl = document.querySelector("#knowledgeTitle");
  if (!titleEl) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const item = data.content.knowledge.find((entry) => entry.id === id);

  if (!item) {
    titleEl.textContent = "未找到该文章";
    const summaryEl = document.querySelector("#knowledgeSummary");
    const contentEl = document.querySelector("#knowledgeContent");
    if (summaryEl) {
      summaryEl.textContent = "请返回知识库列表重新选择。";
    }
    if (contentEl) {
      contentEl.innerHTML = "";
    }
    return;
  }

  const tagsEl = document.querySelector("#knowledgeTags");
  const summaryEl = document.querySelector("#knowledgeSummary");
  const contentEl = document.querySelector("#knowledgeContent");
  const fullText = (item.content || item.summary || "").trim();

  titleEl.textContent = item.title;
  if (tagsEl) {
    tagsEl.innerHTML = (item.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");
  }
  if (summaryEl) {
    summaryEl.textContent = item.summary || "";
  }
  if (contentEl) {
    contentEl.innerHTML = fullText
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");
  }
}

function renderAbout(data) {
  const about = data.content.about;
  const elName = document.querySelector("#aboutName");
  const elBio = document.querySelector("#aboutBio");
  const elInherit = document.querySelector("#aboutInheritance");
  const elAddress = document.querySelector("#studioAddress");
  const teacherList = document.querySelector("#teacherList");

  if (elName) elName.textContent = about.name;
  if (elBio) elBio.textContent = about.bio;
  if (elInherit) elInherit.textContent = about.inheritance;
  if (elAddress) elAddress.textContent = about.studioAddress;
  if (teacherList) {
    teacherList.innerHTML = about.teachers.map((name) => `<li>${name}</li>`).join("");
  }
}

async function init() {
  const page = document.body.dataset.page;
  const data = await getSiteData();

  renderHome(data);
  renderGallery(data);
  renderShop(data);
  renderKnowledge(data);
  renderKnowledgeDetail(data);
  renderAbout(data);

  bindInquiryForm("通用留言");
  bindBookingPrefill();
  bindDynamicActions(data);
}

init();

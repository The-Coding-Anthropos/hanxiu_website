let adminToken = "";
let dashboardData = null;
let selectedWorkId = "";
let selectedProductId = "";
let selectedKnowledgeId = "";

function el(selector) {
  return document.querySelector(selector);
}

async function adminFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "请求失败" }));
    throw new Error(body.message || "请求失败");
  }

  return response.json();
}

async function uploadFileAndFill(fileInputSelector, targetInputSelector, label) {
  const fileInput = el(fileInputSelector);
  const targetInput = el(targetInputSelector);
  const file = fileInput?.files?.[0];

  if (!file) {
    alert(`请先选择要上传的${label}`);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      "x-admin-token": adminToken
    },
    body: formData
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "上传失败" }));
    throw new Error(body.message || "上传失败");
  }

  const result = await response.json();
  targetInput.value = result.url;
  fileInput.value = "";
}

async function uploadFileAndAppendLine(fileInputSelector, targetInputSelector, label) {
  const fileInput = el(fileInputSelector);
  const targetInput = el(targetInputSelector);
  const file = fileInput?.files?.[0];

  if (!file) {
    alert(`请先选择要上传的${label}`);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      "x-admin-token": adminToken
    },
    body: formData
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "上传失败" }));
    throw new Error(body.message || "上传失败");
  }

  const result = await response.json();
  const current = targetInput.value.trim();
  targetInput.value = current ? `${current}\n${result.url}` : result.url;
  fileInput.value = "";
}

function statCard(title, value, hint) {
  return `
    <article class="card">
      <div class="card-body">
        <h4>${title}</h4>
        <p style="font-size: 1.8rem; margin: 8px 0 4px;"><strong>${value}</strong></p>
        <p class="meta">${hint}</p>
      </div>
    </article>
  `;
}

function renderStats(data) {
  const html = [
    statCard("留言总数", data.inquiries.length, "商城购买、定制预约、到店咨询"),
    statCard("作品数量", data.content.works.length, "用于前台展示与定制咨询")
  ].join("");
  el("#statCards").innerHTML = html;
}

function fillQuickEditors(content) {
  el("#homeBannerTitle").value = content.home.bannerTitle || "";
  el("#homeBannerSubtitle").value = content.home.bannerSubtitle || "";
  el("#homeStory").value = content.home.story || "";

  el("#aboutName").value = content.about.name || "";
  el("#aboutBio").value = content.about.bio || "";
  el("#aboutInheritance").value = content.about.inheritance || "";
  el("#aboutStudioAddress").value = content.about.studioAddress || "";
  el("#aboutTeachers").value = (content.about.teachers || []).join("\n");
}

function renderInquiries(inquiries) {
  if (!inquiries.length) {
    el("#inquiryList").innerHTML = "<p class='meta'>暂无留言记录</p>";
    return;
  }

  el("#inquiryList").innerHTML = inquiries
    .map((item) => {
      const options = ["new", "in-progress", "done"]
        .map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`)
        .join("");

      return `
        <article class="card" data-inquiry-id="${item.id}">
          <div class="card-body">
            <h4>${item.name} <span class="pill">${item.type}</span></h4>
            <p class="meta">电话：${item.phone}</p>
            <p class="meta">留言：${item.message || "（无）"}</p>
            <label>跟进状态
              <select data-field="status">${options}</select>
            </label>
            <button class="btn btn-outline" data-action="save-inquiry">保存状态</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAll(data) {
  dashboardData = data;
  renderStats(data);
  fillQuickEditors(data.content);
  renderInquiries(data.inquiries);
  renderWorkManager(data.content.works);
  renderProductManager(data.content.products);
  renderKnowledgeManager(data.content.knowledge);
}

function activateTab(tabName) {
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.pane === tabName);
  });
}

async function refreshDashboard() {
  const data = await adminFetch("/api/admin/overview");
  renderAll(data);
}

el("#adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  adminToken = String(new FormData(event.target).get("token"));

  try {
    await refreshDashboard();
    el("#adminPanel").style.display = "block";
    activateTab("overview");
    el("#adminMsg").textContent = "登录成功，已进入可视化管理面板。";
  } catch (error) {
    el("#adminMsg").textContent = `登录失败：${error.message}`;
  }
});

el("#adminTabs").addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button.admin-tab")) {
    return;
  }
  activateTab(target.dataset.tab);
});

el("#saveHomeBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const value = {
    ...dashboardData.content.home,
    bannerTitle: el("#homeBannerTitle").value,
    bannerSubtitle: el("#homeBannerSubtitle").value,
    story: el("#homeStory").value
  };

  try {
    await adminFetch("/api/admin/content/home", {
      method: "PUT",
      body: JSON.stringify({ value })
    });
    await refreshDashboard();
    alert("首页文案已保存");
  } catch (error) {
    alert(`保存失败：${error.message}`);
  }
});

el("#saveAboutBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const teachers = el("#aboutTeachers")
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const value = {
    ...dashboardData.content.about,
    name: el("#aboutName").value,
    bio: el("#aboutBio").value,
    inheritance: el("#aboutInheritance").value,
    studioAddress: el("#aboutStudioAddress").value,
    teachers
  };

  try {
    await adminFetch("/api/admin/content/about", {
      method: "PUT",
      body: JSON.stringify({ value })
    });
    await refreshDashboard();
    alert("关于我内容已保存");
  } catch (error) {
    alert(`保存失败：${error.message}`);
  }
});

el("#inquiryList").addEventListener("click", async (event) => {
  const target = event.target;
  if (!target.matches("button[data-action='save-inquiry']")) {
    return;
  }

  const card = target.closest("[data-inquiry-id]");
  const id = card.getAttribute("data-inquiry-id");
  const status = card.querySelector("[data-field='status']").value;

  try {
    await adminFetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await refreshDashboard();
    alert("留言状态已更新");
  } catch (error) {
    alert(`更新失败：${error.message}`);
  }
});

el("#uploadWorkCoverBtn").addEventListener("click", async () => {
  try {
    await uploadFileAndFill("#workCoverFile", "#workCover", "封面图");
    alert("封面图上传成功");
  } catch (error) {
    alert(`上传失败：${error.message}`);
  }
});

el("#uploadWorkDetailBtn").addEventListener("click", async () => {
  try {
    await uploadFileAndAppendLine("#workDetailFile", "#workDetails", "细节图");
    alert("细节图上传成功，已追加到列表");
  } catch (error) {
    alert(`上传失败：${error.message}`);
  }
});

el("#uploadWorkVideoBtn").addEventListener("click", async () => {
  try {
    await uploadFileAndFill("#workVideoFile", "#workVideo", "视频");
    alert("视频上传成功");
  } catch (error) {
    alert(`上传失败：${error.message}`);
  }
});

el("#uploadProductImageBtn").addEventListener("click", async () => {
  try {
    await uploadFileAndFill("#productImageFile", "#productImage", "商品图");
    alert("商品图上传成功");
  } catch (error) {
    alert(`上传失败：${error.message}`);
  }
});

el("#uploadProductDetailBtn").addEventListener("click", async () => {
  try {
    await uploadFileAndAppendLine("#productDetailFile", "#productDetails", "商品细节图");
    alert("商品细节图上传成功，已追加到列表");
  } catch (error) {
    alert(`上传失败：${error.message}`);
  }
});

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2, 8)}_${Date.now()}`;
}

function parseLines(text) {
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitSlashValues(text) {
  return String(text)
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function saveContentSection(section, value, successMsg) {
  await adminFetch(`/api/admin/content/${section}`, {
    method: "PUT",
    body: JSON.stringify({ value })
  });
  await refreshDashboard();
  alert(successMsg);
}

function setWorkForm(item) {
  const isNew = !item;
  el("#workEditorTitle").textContent = isNew ? "新增作品" : `编辑作品：${item.title}`;
  el("#workId").value = item?.id || "";
  el("#workTitle").value = item?.title || "";
  el("#workCategory").value = item?.category || "花鸟";
  el("#workSize").value = item?.size || "";
  el("#workMaterial").value = item?.material || "";
  el("#workValue").value = item?.value || "";
  el("#workCover").value = item?.cover || "";
  const detailImages = Array.isArray(item?.detailImages)
    ? item.detailImages
    : item?.detail
      ? [item.detail]
      : [];
  el("#workDetails").value = detailImages.join("\n");
  el("#workVideo").value = item?.video || "";
  el("#workDescription").value = item?.description || "";
}

function renderWorkManager(works) {
  const panel = el("#workList");
  if (!works.length) {
    panel.innerHTML = "<p class='meta'>暂无作品，请点击右侧新增。</p>";
    setWorkForm(null);
    return;
  }

  if (!selectedWorkId || !works.find((item) => item.id === selectedWorkId)) {
    selectedWorkId = works[0].id;
  }

  panel.innerHTML = works
    .map((item) => {
      const active = item.id === selectedWorkId ? "active" : "";
      return `
        <article class="admin-mini-item ${active}" data-work-id="${item.id}">
          <h5>${item.title}</h5>
          <p class="meta">${item.category} | ${item.size}</p>
          <button class="btn btn-outline" data-action="edit-work">编辑该作品</button>
        </article>
      `;
    })
    .join("");

  setWorkForm(works.find((item) => item.id === selectedWorkId) || null);
}

function setProductForm(item) {
  const isNew = !item;
  el("#productEditorTitle").textContent = isNew ? "新增物品" : `编辑物品：${item.name}`;
  el("#productId").value = item?.id || "";
  el("#productName").value = item?.name || "";
  el("#productCategory").value = item?.category || "成品挂画/摆件";
  el("#productSpecs").value = item?.specs?.join("/") || "";
  el("#productPrice").value = item?.price ?? "";
  el("#productShippingFee").value = item?.shippingFee ?? "";
  el("#productImage").value = item?.image || "";
  el("#productDetails").value = (item?.detailImages || []).join("\n");
}

function renderProductManager(products) {
  const panel = el("#productList");
  if (!products.length) {
    panel.innerHTML = "<p class='meta'>暂无物品，请点击右侧新增。</p>";
    setProductForm(null);
    return;
  }

  if (!selectedProductId || !products.find((item) => item.id === selectedProductId)) {
    selectedProductId = products[0].id;
  }

  panel.innerHTML = products
    .map((item) => {
      const active = item.id === selectedProductId ? "active" : "";
      return `
        <article class="admin-mini-item ${active}" data-product-id="${item.id}">
          <h5>${item.name}</h5>
          <p class="meta">${item.category} | ¥${item.price}</p>
          <button class="btn btn-outline" data-action="edit-product">编辑该物品</button>
        </article>
      `;
    })
    .join("");

  setProductForm(products.find((item) => item.id === selectedProductId) || null);
}

function setKnowledgeForm(item) {
  const isNew = !item;
  el("#knowledgeEditorTitle").textContent = isNew ? "新增文章" : `编辑文章：${item.title}`;
  el("#knowledgeId").value = item?.id || "";
  el("#knowledgeTitle").value = item?.title || "";
  el("#knowledgeTags").value = item?.tags?.join("/") || "";
  el("#knowledgeSummary").value = item?.summary || "";
  el("#knowledgeContent").value = item?.content || "";
}

function renderKnowledgeManager(knowledgeList) {
  const panel = el("#knowledgeList");
  if (!knowledgeList.length) {
    panel.innerHTML = "<p class='meta'>暂无知识库文章，请点击右侧新增。</p>";
    setKnowledgeForm(null);
    return;
  }

  if (!selectedKnowledgeId || !knowledgeList.find((item) => item.id === selectedKnowledgeId)) {
    selectedKnowledgeId = knowledgeList[0].id;
  }

  panel.innerHTML = knowledgeList
    .map((item) => {
      const active = item.id === selectedKnowledgeId ? "active" : "";
      return `
        <article class="admin-mini-item ${active}" data-knowledge-id="${item.id}">
          <h5>${item.title}</h5>
          <p class="meta">${(item.tags || []).join(" / ")}</p>
          <button class="btn btn-outline" data-action="edit-knowledge">编辑该文章</button>
        </article>
      `;
    })
    .join("");

  setKnowledgeForm(knowledgeList.find((item) => item.id === selectedKnowledgeId) || null);
}

el("#workList").addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button[data-action='edit-work']")) {
    return;
  }

  const card = target.closest("[data-work-id]");
  selectedWorkId = card.getAttribute("data-work-id");
  renderWorkManager(dashboardData.content.works);
});

el("#newWorkBtn").addEventListener("click", () => {
  selectedWorkId = "";
  setWorkForm(null);
});

el("#saveWorkBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#workId").value || makeId("w");
  const item = {
    id,
    title: el("#workTitle").value.trim(),
    category: el("#workCategory").value,
    size: el("#workSize").value.trim(),
    material: el("#workMaterial").value.trim(),
    value: el("#workValue").value.trim(),
    cover: el("#workCover").value.trim(),
    detailImages: parseLines(el("#workDetails").value),
    video: el("#workVideo").value.trim(),
    description: el("#workDescription").value.trim()
  };
  item.detail = item.detailImages[0] || "";

  if (!item.title) {
    alert("请填写作品标题");
    return;
  }

  const next = [...dashboardData.content.works];
  const idx = next.findIndex((entry) => entry.id === id);
  if (idx >= 0) {
    next[idx] = item;
  } else {
    next.push(item);
  }

  selectedWorkId = id;
  try {
    await saveContentSection("works", next, "作品已保存");
  } catch (error) {
    alert(`保存失败：${error.message}`);
  }
});

el("#deleteWorkBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#workId").value;
  if (!id) {
    alert("当前是新建状态，无需删除");
    return;
  }

  if (!window.confirm("确定删除这个作品吗？")) {
    return;
  }

  const next = dashboardData.content.works.filter((item) => item.id !== id);
  selectedWorkId = next[0]?.id || "";
  try {
    await saveContentSection("works", next, "作品已删除");
    if (!selectedWorkId) {
      setWorkForm(null);
    }
  } catch (error) {
    alert(`删除失败：${error.message}`);
  }
});

el("#productList").addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button[data-action='edit-product']")) {
    return;
  }

  const card = target.closest("[data-product-id]");
  selectedProductId = card.getAttribute("data-product-id");
  renderProductManager(dashboardData.content.products);
});

el("#newProductBtn").addEventListener("click", () => {
  selectedProductId = "";
  setProductForm(null);
});

el("#saveProductBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#productId").value || makeId("p");
  const item = {
    id,
    name: el("#productName").value.trim(),
    category: el("#productCategory").value,
    specs: splitSlashValues(el("#productSpecs").value),
    price: Number(el("#productPrice").value) || 0,
    shippingFee: Number(el("#productShippingFee").value) || 0,
    image: el("#productImage").value.trim(),
    detailImages: parseLines(el("#productDetails").value)
  };

  if (!item.name) {
    alert("请填写物品名称");
    return;
  }

  if (!item.specs.length) {
    alert("请至少填写一个规格");
    return;
  }

  const next = [...dashboardData.content.products];
  const idx = next.findIndex((entry) => entry.id === id);
  if (idx >= 0) {
    next[idx] = item;
  } else {
    next.push(item);
  }

  selectedProductId = id;
  try {
    await saveContentSection("products", next, "商城物品已保存");
  } catch (error) {
    alert(`保存失败：${error.message}`);
  }
});

el("#deleteProductBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#productId").value;
  if (!id) {
    alert("当前是新建状态，无需删除");
    return;
  }

  if (!window.confirm("确定删除这个商城物品吗？")) {
    return;
  }

  const next = dashboardData.content.products.filter((item) => item.id !== id);
  selectedProductId = next[0]?.id || "";
  try {
    await saveContentSection("products", next, "商城物品已删除");
    if (!selectedProductId) {
      setProductForm(null);
    }
  } catch (error) {
    alert(`删除失败：${error.message}`);
  }
});

el("#knowledgeList").addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button[data-action='edit-knowledge']")) {
    return;
  }

  const card = target.closest("[data-knowledge-id]");
  selectedKnowledgeId = card.getAttribute("data-knowledge-id");
  renderKnowledgeManager(dashboardData.content.knowledge);
});

el("#newKnowledgeBtn").addEventListener("click", () => {
  selectedKnowledgeId = "";
  setKnowledgeForm(null);
});

el("#saveKnowledgeBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#knowledgeId").value || makeId("k");
  const item = {
    id,
    title: el("#knowledgeTitle").value.trim(),
    tags: splitSlashValues(el("#knowledgeTags").value),
    summary: el("#knowledgeSummary").value.trim(),
    content: el("#knowledgeContent").value.trim()
  };

  if (!item.title) {
    alert("请填写文章标题");
    return;
  }

  if (!item.summary) {
    alert("请填写文章摘要");
    return;
  }

  if (!item.content) {
    alert("请填写文章正文");
    return;
  }

  const next = [...dashboardData.content.knowledge];
  const idx = next.findIndex((entry) => entry.id === id);
  if (idx >= 0) {
    next[idx] = item;
  } else {
    next.push(item);
  }

  selectedKnowledgeId = id;
  try {
    await saveContentSection("knowledge", next, "知识库文章已保存");
  } catch (error) {
    alert(`保存失败：${error.message}`);
  }
});

el("#deleteKnowledgeBtn").addEventListener("click", async () => {
  if (!dashboardData) {
    return;
  }

  const id = el("#knowledgeId").value;
  if (!id) {
    alert("当前是新建状态，无需删除");
    return;
  }

  if (!window.confirm("确定删除这篇知识库文章吗？")) {
    return;
  }

  const next = dashboardData.content.knowledge.filter((item) => item.id !== id);
  selectedKnowledgeId = next[0]?.id || "";
  try {
    await saveContentSection("knowledge", next, "知识库文章已删除");
    if (!selectedKnowledgeId) {
      setKnowledgeForm(null);
    }
  } catch (error) {
    alert(`删除失败：${error.message}`);
  }
});

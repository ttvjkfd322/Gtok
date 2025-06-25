// ========== Variables ==========
let users = JSON.parse(localStorage.getItem("users")) || {};
let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentUser = localStorage.getItem("currentUser") || null;
const ADMIN_USER = "admin";

// ========== Authentication ==========
function signup() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;

  if (!username || !password) {
    return displayAuth("Fill in both fields.");
  }

  if (users[username]) {
    displayAuth("User already exists.");
  } else {
    // WARNING: Passwords stored as plaintext in localStorage - not secure for production.
    users[username] = password;
    localStorage.setItem("users", JSON.stringify(users));
    displayAuth("Account created. Now log in.");
  }
}

function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;

  if (users[username] === password) {
    currentUser = username;
    localStorage.setItem("currentUser", currentUser);
    displayAuth("");
    showApp();
  } else {
    displayAuth("Invalid login.");
  }
}

function displayAuth(msg) {
  document.getElementById("authMessage").textContent = msg;
}

// ========== UI ==========
function showApp() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("mainNav").classList.remove("hidden");
  showPage("home");

  const status = currentUser === ADMIN_USER ? "🛡️ Admin" : "🟢 Online";
  document.getElementById("userStatus").textContent = `Logged in as ${currentUser} ${status}`;

  renderPosts();
}

// ========== Page Navigation ==========
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(`${pageId}Page`).classList.remove("hidden");
}

// ========== Post Handling ==========
function submitPost() {
  const content = document.getElementById("postContent").value.trim();
  if (!content) return;

  const newPost = {
    id: Date.now(),
    author: currentUser,
    message: sanitizeText(content),
    timestamp: new Date().toISOString(), // Store ISO string, format on display
    likes: 0,
    likedBy: [], // Track users who liked to prevent multiple likes
    comments: []
  };

  posts.unshift(newPost);
  saveAndRender();
  document.getElementById("postContent").value = "";
}

function likePost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  if (!post.likedBy.includes(currentUser)) {
    post.likes++;
    post.likedBy.push(currentUser);
    saveAndRender();
  } else {
    alert("You already liked this post.");
  }
}

function deletePost(id) {
  if (currentUser !== ADMIN_USER) {
    alert("Only admin can delete posts.");
    return;
  }
  posts = posts.filter(p => p.id !== id);
  saveAndRender();
}

function addComment(id, text, inputElement) {
  if (!text.trim()) return;

  const post = posts.find(p => p.id === id);
  if (!post) return;

  post.comments.push({
    author: currentUser,
    text: sanitizeText(text.trim())
  });

  saveAndRender();

  // Clear input box after adding comment
  if (inputElement) {
    inputElement.value = "";
  }
}

// Render posts (with optional filtered list)
function renderPosts(filteredPosts = posts) {
  const container = document.getElementById("postFeed");
  container.innerHTML = "";

  filteredPosts.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post");

    const canDelete = currentUser === ADMIN_USER;

    let commentsHTML = "";
    post.comments.forEach(c => {
      commentsHTML += `<p><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</p>`;
    });

    // Format date for display
    const dateStr = new Date(post.timestamp).toLocaleString();

    div.innerHTML = `
      <strong>${escapeHTML(post.author)}</strong> <small>${dateStr}</small>
      <p>${escapeHTML(post.message)}</p>

      <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
      ${canDelete ? `<button onclick="deletePost(${post.id})">🗑️</button>` : ""}

      <div class="comment-box">
        <input type="text" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value, this)">
      </div>
      <div class="comments">${commentsHTML}</div>
    `;

    container.appendChild(div);
  });
}

function saveAndRender() {
  localStorage.setItem("posts", JSON.stringify(posts));
  filterPosts();
}

// ========== Filtering ==========
function filterPosts() {
  const query = document.getElementById("filterInput").value.toLowerCase();
  const filtered = posts.filter(post =>
    post.author.toLowerCase().includes(query) ||
    post.message.toLowerCase().includes(query)
  );
  renderPosts(filtered);
}

// ========== Helpers ==========

// Sanitize text for safe HTML output
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// Escape HTML characters for safe text insertion
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

// ========== Auto-login ==========
if (currentUser) {
  showApp();
}
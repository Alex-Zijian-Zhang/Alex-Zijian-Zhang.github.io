"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    initSmoothScrolling();
    initActiveSectionTracking();
    await loadAllData();
});

async function loadAllData() {
    const [
        sidebarData,
        profileData,
        newsData,
        experienceData,
        publicationsData,
        awardsData,
        fundingsData,
        servicesData,
        studentsData
    ] = await Promise.all([
        fetchJson("data/core/sidebar.json"),
        fetchJson("data/core/profile.json"),
        fetchJson("data/research/news.json"),
        fetchJson("data/career/experience.json"),
        fetchJson("data/research/publications.json"),
        fetchJson("data/career/awards.json"),
        fetchJson("data/research/fundings.json"),
        fetchJson("data/career/services.json"),
        fetchJson("data/career/students.json")
    ]);

    renderSidebar(sidebarData);
    renderProfile(profileData);
    renderNews(newsData);
    renderExperience(experienceData);
    renderPublications(publicationsData);
    renderAwards(awardsData);
    renderFundings(fundingsData);
    renderServices(servicesData);
    renderStudents(studentsData);
}

async function fetchJson(path) {
    try {
        const resp = await fetch(path);
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }
        return await resp.json();
    } catch (err) {
        console.error(`Failed to fetch ${path}:`, err);
        return null;
    }
}

function renderSidebar(data) {
    if (!data) {
        return;
    }
    setText("sidebar-name", data.name);
    setText("sidebar-role", data.role);
    setText("sidebar-university", data.university);
    setText("sidebar-copyright", data.copyright);
    setText("main-footer-text", data.footer);

    const avatar = document.querySelector(".avatar");
    if (avatar && data.avatar) {
        avatar.src = data.avatar.src || avatar.src;
        avatar.alt = data.avatar.alt || avatar.alt;
    }

    const socialRoot = document.getElementById("sidebar-social-links");
    if (!socialRoot) {
        return;
    }
    socialRoot.innerHTML = "";

    (data.socialLinks || []).forEach((link) => {
        const a = document.createElement("a");
        a.href = link.href || "#";
        a.title = link.title || "";
        if (link.external) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
        }
        const icon = document.createElement("i");
        icon.className = link.icon || "";
        a.appendChild(icon);
        socialRoot.appendChild(a);
    });
}

function renderProfile(data) {
    if (!data) {
        return;
    }
    setText("profile-lead", cleanText(data.lead || ""));
    setText("profile-bio", cleanText(data.bio || ""));
}

function renderNews(data) {
    if (!data) {
        return;
    }
    const openRoot = document.getElementById("news-open-positions");
    if (openRoot) {
        const title = cleanText(data.openPositions?.title || "Open Positions");
        const desc = cleanText(data.openPositions?.description || "");
        const email = cleanText(data.openPositions?.email || "");
        const emailLink = email ? `<a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a>` : "";
        openRoot.innerHTML = `<strong>${escapeHTML(title)}:</strong> ${escapeHTML(desc)}${email && !desc.includes(email) ? ` ${emailLink}.` : ""}`;
    }

    const list = document.getElementById("news-timeline");
    if (!list) {
        return;
    }
    list.innerHTML = "";

    let lastYear = "";
    (data.items || []).forEach((item) => {
        if (item.year && item.year !== lastYear) {
            const yearLi = document.createElement("li");
            yearLi.className = "year-divider";
            yearLi.innerHTML = `<span>${escapeHTML(item.year)}</span>`;
            list.appendChild(yearLi);
            lastYear = item.year;
        }

        const li = document.createElement("li");
        const newsText = cleanText(item.text || "");
        const venue = cleanText(item.venue || "");
        const coreText = venue ? newsText.replace(new RegExp(`\\s*accepted by\\s+${escapeRegExp(venue)}\\s*\\.?$`, "i"), "") : newsText;
        const highlightedCoreText = formatNewsTitle(coreText);
        li.innerHTML = `
            <span class="date">${escapeHTML(item.date || "")}</span>
            <div class="text">${highlightedCoreText}${venue ? ` accepted by <span class="news-venue-inline">${escapeHTML(venue)}</span>.` : ""}</div>
        `;
        list.appendChild(li);
    });
}

function renderExperience(data) {
    const root = document.getElementById("experience-list");
    if (!root || !data) {
        return;
    }
    root.innerHTML = "";

    (data.items || []).forEach((item) => {
        const block = document.createElement("div");
        block.className = "exp-item";
        block.innerHTML = `
            <div class="exp-year">${escapeHTML(item.period || "")}</div>
            <div class="exp-detail">
                <strong>${escapeHTML(item.title || "")}</strong>
                <span>${escapeHTML(item.organization || "")}</span>
            </div>
        `;
        root.appendChild(block);
    });
}

function renderPublications(data) {
    const items = (data && data.items) ? data.items : [];
    const monographs = items.filter((x) => (x.Type || "").trim() === "Book");
    const papers = items.filter((x) => (x.Type || "").trim() !== "Book");

    renderPublicationsList(monographs, document.getElementById("monograph-list"), true);
    renderPublicationsList(papers, document.getElementById("papers-list"), false);
}

function renderPublicationsList(publications, container, isMonograph) {
    if (!container) {
        return;
    }
    if (!publications || publications.length === 0) {
        container.innerHTML = '<p class="no-data">No publications found.</p>';
        return;
    }

    let html = "";
    publications.forEach((pub, idx) => {
        const title = escapeHTML(pub.Title || "");
        const link = normalizeText(pub.Link);
        const shortName = escapeHTML(pub.JournalShortName || "");
        const journalFullName = escapeHTML(pub.JournalFullName || "");
        const publicationDetail = escapeHTML(pub.PublicationDetail || "");
        const ccf = escapeHTML(pub.CCF || "");
        const safeAuthors = escapeHTML(pub.Authors || "").replace(
            /(Zijian Zhang\*?)/g,
            '<b class="my-name">$1</b>'
        );

        const titleHtml = link
            ? `<a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">${title}</a>`
            : `<span class="pub-title-text">${title}</span>`;

        let pdfLink = "";
        const pdfFile = normalizeText(pub.PDFFile);
        if (pdfFile) {
            const pdfHref = encodeURI(`papers/${pdfFile}`);
            pdfLink = `<a href="${pdfHref}" class="pdf-btn" target="_blank" rel="noopener noreferrer"><i class="far fa-file-pdf"></i> PDF</a>`;
        }

        html += `
            <div class="pub-item">
                <div class="pub-index">${idx + 1}.</div>
                <div class="pub-details">
                    <div class="pub-title">
                        ${!isMonograph && shortName ? `<span class="venue-chip">${shortName}</span>` : ""}
                        ${titleHtml}
                    </div>
                    <div class="pub-authors">${safeAuthors}</div>
                    <div class="pub-venue">
                        ${journalFullName ? `<strong>${journalFullName}</strong>` : ""}
                        ${!isMonograph && publicationDetail ? `, ${publicationDetail}` : ""}
                        ${ccf ? `<span class="ccf-tag">${ccf}</span>` : ""}
                    </div>
                    ${pdfLink ? `<div class="pub-links">${pdfLink}</div>` : ""}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderAwards(data) {
    if (!data) {
        return;
    }
    const list = document.getElementById("awards-list");
    const gallery = document.getElementById("awards-gallery");
    if (!list || !gallery) {
        return;
    }

    list.innerHTML = "";
    (data.awards || []).forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas fa-award"></i> ${escapeHTML(cleanText(item))}`;
        list.appendChild(li);
    });

    gallery.innerHTML = "";
    (data.gallery || []).forEach((item) => {
        const fig = document.createElement("figure");
        fig.className = "gallery-item";
        fig.innerHTML = `
            <img src="${escapeHTML(item.src || "")}" alt="${escapeHTML(item.alt || "")}" loading="lazy">
            <figcaption>${escapeHTML(item.caption || "")}</figcaption>
        `;
        gallery.appendChild(fig);
    });
}

function renderFundings(data) {
    const root = document.getElementById("fundings-list");
    if (!root || !data) {
        return;
    }
    root.innerHTML = "";
    (data.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${escapeHTML(item.role || "")}</strong>, ${escapeHTML(item.detail || "")}
            ${item.grantNo ? `<span class="grant-no">${escapeHTML(item.grantNo)}</span>` : ""}
        `;
        root.appendChild(li);
    });
}

function renderServices(data) {
    if (!data) {
        return;
    }
    const top = document.getElementById("services-grid-top");
    const bottom = document.getElementById("services-grid-bottom");
    if (!top || !bottom) {
        return;
    }

    top.innerHTML = `
        <div class="card">
            <h3>Membership</h3>
            <ul>${(data.membership || []).map((x) => `<li>${escapeHTML(x)}</li>`).join("")}</ul>
        </div>
        <div class="card">
            <h3>Journal Editorial Board</h3>
            <ul>${(data.editorialBoard || []).map((x) => `<li>${escapeHTML(cleanText(x))}</li>`).join("")}</ul>
        </div>
    `;

    const conferenceBlocks = (data.conferenceService || []).map((x) => `
        <div class="service-sub-section">
            <strong>${escapeHTML(x.label || "")}:</strong>
            <span class="text-muted">${escapeHTML(x.content || "")}</span>
        </div>
    `).join("");

    bottom.innerHTML = `
        <div class="card full-width">
            <h3>Conference &amp; Journal Service</h3>
            ${conferenceBlocks}
        </div>
    `;
}

function renderStudents(data) {
    const root = document.getElementById("students-groups");
    if (!root || !data) {
        return;
    }
    root.innerHTML = "";

    (data.groups || []).forEach((group) => {
        const groupEl = document.createElement("div");
        groupEl.className = "student-group";

        const people = (group.items || []).map((item) => {
            const parts = [];
            parts.push(`<span class="student-name">${escapeHTML(item.name || "")}</span>`);
            if (item.meta || item.supervisor || item.year || item.destination || item.logo) {
                parts.push('<span class="tag-divider">|</span>');
            }
            if (item.logo) {
                parts.push(`<img src="${escapeHTML(item.logo)}" class="uni-logo-inline" alt="${escapeHTML(item.logoAlt || "logo")}">`);
            }
            if (item.meta) {
                parts.push(`<span class="tag-meta">${escapeHTML(item.meta)}</span>`);
            }
            if (item.supervisor) {
                parts.push(`<span class="supervisor-info">${escapeHTML(item.supervisor)}</span>`);
            }
            if (item.year) {
                parts.push(`<span class="tag-year">${escapeHTML(item.year)}</span>`);
            }
            if (item.destination) {
                parts.push(`<span class="alumni-destination">${escapeHTML(item.destination)}</span>`);
            }
            return `<div class="person-tag">${parts.join("")}</div>`;
        }).join("");

        groupEl.innerHTML = `
            <h3>${escapeHTML(group.title || "")}</h3>
            <div class="people-grid">${people}</div>
        `;
        root.appendChild(groupEl);
    });
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            const target = targetId ? document.querySelector(targetId) : null;
            if (!target) {
                return;
            }
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
        });
    });
}

function initActiveSectionTracking() {
    const onScroll = () => {
        const sections = document.querySelectorAll("section[id]");
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        let currentActiveId = "";

        const isNearBottom = window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight - 500;
        if (isNearBottom && sections.length > 0) {
            currentActiveId = sections[sections.length - 1].getAttribute("id") || "";
        } else {
            let maxOffsetTop = -1;
            sections.forEach((section) => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset + 150 >= sectionTop && sectionTop > maxOffsetTop) {
                    maxOffsetTop = sectionTop;
                    currentActiveId = section.getAttribute("id") || "";
                }
            });
        }

        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentActiveId}`) {
                link.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value || "";
    }
}

function normalizeText(value) {
    return String(value || "").trim();
}

function cleanText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.!?;:])/g, "$1")
        .trim();
}

function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatNewsTitle(text) {
    const escaped = escapeHTML(text || "");
    return escaped.replace(/&quot;([^&]+?)&quot;/, '<strong class="news-paper-title">"$1"</strong>');
}

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

import { mountTemplate } from '../dom.js';
import { addEntry } from '../store.js';
import { createTimer } from '../timer.js';

export function renderRitual(view, content, params) {
    const monster = content.monstersBySlug.get(params.monster);
    const ritual = content.ritualsBySlug.get(params.ritual);

    if (!ritual) {
        view.innerHTML = `<p>Ritual not found. <a href="#/today">Back to Today</a>.</p>`;
        return;
    }

    mountTemplate(view, 'view-ritual');

    if (monster?.accentColor) {
        view.style.setProperty('--accent', monster.accentColor);
    }

    view.querySelector('#ritualMonster').textContent = monster?.name || '';
    view.querySelector('#ritualTitle').textContent = ritual.title;
    view.querySelector('#ritualIntro').textContent = ritual.heroIntro || ritual.description || '';

    if (ritual.oath?.length) {
        const oath = view.querySelector('#ritualOath');
        const body = view.querySelector('#ritualOathBody');
        oath.hidden = false;
        body.innerHTML = '';
        for (const line of ritual.oath) {
            const p = document.createElement('p');
            p.textContent = line;
            body.appendChild(p);
        }
    }

    if (ritual.howToUse?.length) {
        const steps = view.querySelector('#ritualSteps');
        const list = view.querySelector('#ritualStepsList');
        steps.hidden = false;
        list.innerHTML = '';
        for (const step of ritual.howToUse) {
            const li = document.createElement('li');
            li.textContent = step;
            list.appendChild(li);
        }
    }

    if (ritual.whyItHelps?.length) {
        const why = view.querySelector('#ritualWhy');
        const list = view.querySelector('#ritualWhyList');
        why.hidden = false;
        list.innerHTML = '';
        for (const reason of ritual.whyItHelps) {
            const li = document.createElement('li');
            li.textContent = reason;
            list.appendChild(li);
        }
    }

    setupTimer(view);
    setupJournal(view, monster, ritual);
}

function setupTimer(view) {
    const display = view.querySelector('#timerDisplay');
    const startBtn = view.querySelector('#timerStart');
    const stopBtn = view.querySelector('#timerStop');
    const presetBtns = view.querySelectorAll('.timer__controls button');

    let minutes = 15;
    const timer = createTimer({
        onTick: (remainingMs) => {
            const total = Math.ceil(remainingMs / 1000);
            const m = String(Math.floor(total / 60)).padStart(2, '0');
            const s = String(total % 60).padStart(2, '0');
            display.textContent = `${m}:${s}`;
        },
        onDone: () => {
            display.textContent = 'Done.';
            startBtn.hidden = false;
            stopBtn.hidden = true;
        }
    });

    function setPreset(mins) {
        minutes = mins;
        display.textContent = `${String(mins).padStart(2, '0')}:00`;
        presetBtns.forEach((b) => {
            const isActive = Number(b.dataset.minutes) === mins;
            b.setAttribute('aria-pressed', String(isActive));
            b.classList.toggle('is-default', isActive);
        });
    }

    presetBtns.forEach((b) => {
        b.addEventListener('click', () => setPreset(Number(b.dataset.minutes)));
    });

    startBtn.addEventListener('click', () => {
        timer.start(minutes * 60 * 1000);
        startBtn.hidden = true;
        stopBtn.hidden = false;
    });

    stopBtn.addEventListener('click', () => {
        timer.stop();
        startBtn.hidden = false;
        stopBtn.hidden = true;
    });

    setPreset(minutes);
}

function setupJournal(view, monster, ritual) {
    const noteEl = view.querySelector('#ritualNote');
    const saveBtn = view.querySelector('#ritualSave');
    const saved = view.querySelector('#ritualSaved');

    saveBtn.addEventListener('click', () => {
        addEntry({
            monsterSlug: monster?.slug,
            monsterName: monster?.name,
            ritualSlug: ritual.slug,
            ritualTitle: ritual.title,
            note: noteEl.value.trim()
        });
        saved.hidden = false;
        saveBtn.disabled = true;
        setTimeout(() => {
            saved.hidden = true;
            saveBtn.disabled = false;
            noteEl.value = '';
        }, 1500);
    });
}

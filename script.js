let boards = [];
let currentBoardId = null;

const createBoardBtn = document.getElementById('createBoardBtn');
const boardListEl = document.getElementById('boardList');
const boardDetailsEl = document.getElementById('boardDetails');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalContextType = document.getElementById('modalContextType');
const modalContextId = document.getElementById('modalContextId');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

createBoardBtn.addEventListener('click', () => {
    openModal({ title: 'Create Board', contextType: 'createBoard' });
});

modalCancelBtn.addEventListener('click', closeModal);
modalSaveBtn.addEventListener('click', handleModalSave);

function openModal({ title, defaultValue = '', contextType, contextId = '' }) {
    modalTitle.textContent = title;
    modalInput.value = defaultValue;
    modalContextType.value = contextType;
    modalContextId.value = contextId;
    modalOverlay.style.display = 'flex';
    modalInput.focus();
}

function closeModal() {
    modalOverlay.style.display = 'none';
    modalInput.value = '';
    modalContextType.value = '';
    modalContextId.value = '';
}

function handleModalSave() {
    const name = modalInput.value.trim();
    const type = modalContextType.value;
    const id = modalContextId.value;

    if (!name) {
        alert('Please enter a name.');
        return;
    }

    switch (type) {
        case 'createBoard':
            createBoard(name);
            break;
        case 'createTicket':
            createTicket(id, name);
            break;
        case 'editTicket':
            editTicket(id, name);
            break;
    }

    closeModal();
}

function generateId(prefix) {
    return `${prefix}-${Math.floor(Math.random() * 1000000)}`;
}

function createBoard(name) {
    const board = {
        id: generateId('board'),
        name,
        columns: [
            { id: generateId('col'), name: 'To Do', tickets: [] },
            { id: generateId('col'), name: 'In Progress', tickets: [] },
            { id: generateId('col'), name: 'Done', tickets: [] }
        ]
    };
    boards.push(board);
    renderBoardList();
    selectBoard(board.id);
}

function renderBoardList() {
    boardListEl.innerHTML = '';
    boards.forEach(board => {
        const li = document.createElement('li');
        li.textContent = board.name;
        li.dataset.id = board.id;
        li.classList.toggle('active', board.id === currentBoardId);
        li.addEventListener('click', () => selectBoard(board.id));
        boardListEl.appendChild(li);
    });
}

function selectBoard(boardId) {
    currentBoardId = boardId;
    const board = boards.find(b => b.id === boardId);
    renderBoardList();
    renderBoardDetails(board);
}

function createTicket(colId, name) {
    const board = boards.find(b => b.id === currentBoardId);
    const column = board?.columns.find(c => c.id === colId);
    if (!column) return;
    column.tickets.push({ id: generateId('ticket'), name });
    renderBoardDetails(board);
}

function editTicket(ticketId, newName) {
    const board = boards.find(b => b.id === currentBoardId);
    if (!board) return;
    for (const col of board.columns) {
        const ticket = col.tickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.name = newName;
            break;
        }
    }
    renderBoardDetails(board);
}

function deleteTicket(ticketId) {
    const board = boards.find(b => b.id === currentBoardId);
    if (!board) return;
    for (const col of board.columns) {
        col.tickets = col.tickets.filter(t => t.id !== ticketId);
    }
    renderBoardDetails(board);
}

function moveTicket(ticketId, targetColumnId) {
    const board = boards.find(b => b.id === currentBoardId);
    if (!board) return;

    let movedTicket = null;

    for (const column of board.columns) {
        const index = column.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            movedTicket = column.tickets.splice(index, 1)[0];
            break;
        }
    }

    if (movedTicket) {
        const targetColumn = board.columns.find(c => c.id === targetColumnId);
        if (targetColumn) {
            targetColumn.tickets.push(movedTicket);
            renderBoardDetails(board);
        }
    }
}

function renderBoardDetails(board) {
    boardDetailsEl.innerHTML = '';
    if (!board) {
        boardDetailsEl.innerHTML = '<p>No board selected. Create or select a board.</p>';
        return;
    }

    const titleArea = document.createElement('div');
    titleArea.classList.add('boardTitleArea');

    const h2 = document.createElement('h2');
    h2.textContent = board.name;
    titleArea.appendChild(h2);

    boardDetailsEl.appendChild(titleArea);

    const columnsContainer = document.createElement('div');
    columnsContainer.classList.add('columnsContainer');

    board.columns.forEach(column => {
        const colEl = document.createElement('div');
        colEl.classList.add('column');
        colEl.dataset.columnId = column.id;

        // Allow column to accept drop
        colEl.addEventListener('dragover', e => e.preventDefault());
        colEl.addEventListener('drop', e => {
            const ticketId = e.dataTransfer.getData('text/plain');
            moveTicket(ticketId, column.id);
        });

        const header = document.createElement('div');
        header.classList.add('columnHeader');

        const colTitle = document.createElement('h3');
        colTitle.textContent = column.name;

        header.appendChild(colTitle);
        colEl.appendChild(header);

        column.tickets.forEach(ticket => {
            const ticketEl = document.createElement('div');
            ticketEl.classList.add('ticket');
            ticketEl.setAttribute('draggable', 'true');
            ticketEl.dataset.ticketId = ticket.id;

            ticketEl.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', ticket.id);
            });

            const nameSpan = document.createElement('span');
            nameSpan.textContent = ticket.name;

            const ticketBtns = document.createElement('div');
            ticketBtns.classList.add('ticketButtons');

            const editBtn = document.createElement('button');
            editBtn.classList.add('editTicketBtn');
            editBtn.textContent = '✎';
            editBtn.addEventListener('click', () =>
                openModal({
                    title: 'Edit Ticket',
                    contextType: 'editTicket',
                    contextId: ticket.id,
                    defaultValue: ticket.name
                })
            );

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('deleteTicketBtn');
            deleteBtn.textContent = '🗑️';
            deleteBtn.addEventListener('click', () => deleteTicket(ticket.id));

            ticketBtns.append(editBtn, deleteBtn);
            ticketEl.append(nameSpan, ticketBtns);
            colEl.appendChild(ticketEl);
        });

        const addTicketBtn = document.createElement('button');
        addTicketBtn.classList.add('addTicket');
        addTicketBtn.textContent = 'Add Ticket';
        addTicketBtn.addEventListener('click', () =>
            openModal({
                title: 'Create Ticket',
                contextType: 'createTicket',
                contextId: column.id
            })
        );

        colEl.appendChild(addTicketBtn);
        columnsContainer.appendChild(colEl);
    });

    boardDetailsEl.appendChild(columnsContainer);
}

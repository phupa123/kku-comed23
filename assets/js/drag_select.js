/**
 * =========================================================================
 * DRAG-TO-SELECT MOUSE ENGINE - assets/js/drag_select.js
 * ความสามารถใช้เมาส์คลิกลากคลุมพื้นที่ (Lasso Selection Box) เพื่อเลือกหลายไฟล์
 * รองรับการกด Shift / Ctrl เพื่อบวกเพิ่ม/ลดไฟล์ที่เลือก
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  class DragSelectEngine {
    constructor(options = {}) {
      this.container = null;
      this.itemSelector = options.itemSelector || '[data-file-id]';
      this.onSelectionChange = options.onSelectionChange || (() => {});
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.selectionBox = null;
      this.initialSelectedIds = new Set();
      this.boundMouseDown = this.handleMouseDown.bind(this);
      this.boundMouseMove = this.handleMouseMove.bind(this);
      this.boundMouseUp = this.handleMouseUp.bind(this);
    }

    init(containerElement) {
      if (!containerElement) return;
      this.container = containerElement;
      this.createSelectionBox();
      this.container.addEventListener('mousedown', this.boundMouseDown);
    }

    destroy() {
      if (this.container) {
        this.container.removeEventListener('mousedown', this.boundMouseDown);
      }
      if (this.selectionBox && this.selectionBox.parentElement) {
        this.selectionBox.parentElement.removeChild(this.selectionBox);
      }
      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }

    createSelectionBox() {
      if (this.selectionBox) return;
      const box = document.createElement('div');
      box.id = 'dragSelectionBox';
      box.className = 'fixed pointer-events-none z-50 bg-orange-500/15 border-2 border-dashed border-orange-500 rounded-xl hidden transition-none';
      box.style.backdropFilter = 'blur(1px)';
      document.body.appendChild(box);
      this.selectionBox = box;
    }

    handleMouseDown(e) {
      // Only respond to Primary (Left) button click
      if (e.button !== 0) return;
      
      // Do not initiate drag selection if clicked inside inputs, buttons, checkboxes, anchors, or interactive modals
      const target = e.target;
      if (target.closest('button, a, input, select, textarea, label, [data-no-drag]')) {
        return;
      }

      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;

      const isAdditive = e.ctrlKey || e.metaKey || e.shiftKey;
      if (isAdditive && typeof window.getSelectedFileIds === 'function') {
        this.initialSelectedIds = new Set(window.getSelectedFileIds());
      } else {
        this.initialSelectedIds = new Set();
      }

      window.addEventListener('mousemove', this.boundMouseMove);
      window.addEventListener('mouseup', this.boundMouseUp);
    }

    handleMouseMove(e) {
      if (!this.isDragging) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);

      // Only show box if dragged more than 5px to avoid swallowing accidental clicks
      if (width > 5 || height > 5) {
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
        this.selectionBox.classList.remove('hidden');

        // Check intersection with all file items
        this.updateItemSelection({ left, top, right: left + width, bottom: top + height }, e);
      }
    }

    updateItemSelection(boxRect, e) {
      if (!this.container) return;
      const items = this.container.querySelectorAll(this.itemSelector);
      const newlySelected = new Set(this.initialSelectedIds);
      const isAdditive = e.ctrlKey || e.metaKey || e.shiftKey;

      items.forEach(el => {
        const fileId = el.getAttribute('data-file-id');
        if (!fileId) return;

        const rect = el.getBoundingClientRect();
        // Intersection check
        const isOverlapping = !(
          rect.right < boxRect.left ||
          rect.left > boxRect.right ||
          rect.bottom < boxRect.top ||
          rect.top > boxRect.bottom
        );

        if (isOverlapping) {
          newlySelected.add(fileId);
        } else if (!isAdditive) {
          newlySelected.delete(fileId);
        }
      });

      this.onSelectionChange(Array.from(newlySelected));
    }

    handleMouseUp(e) {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.selectionBox) {
        this.selectionBox.classList.add('hidden');
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
      }

      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }
  }

  window.DragSelectEngine = DragSelectEngine;

})(window);

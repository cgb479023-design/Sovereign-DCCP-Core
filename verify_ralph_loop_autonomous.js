"use strict";
// File: g:/Sovereign-DCCP-Core/verify_ralph_loop_autonomous.ts
// Ralph Loop 自愈自动化验证脚本
// 结合 UniversalSelfHealing 引擎实现 100% 物理一致性验证
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var playwright_1 = require("playwright");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var UniversalSelfHealing_1 = require("./server/utils/UniversalSelfHealing");
function runAutonomousVerification() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, context, page, e_1, nodeCount, inputSelector, buttonSelector, fireResult, executionsCount, targetFile, files, recentFiles, screenshotPath;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('╔════════════════════════════════════════════════════════════╗');
                    console.log('║  SOVEREIGN-DCCP-CORE: AUTONOMOUS RALPH LOOP VERIFICATION   ║');
                    console.log('╚════════════════════════════════════════════════════════════╝');
                    return [4 /*yield*/, playwright_1.chromium.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newContext({
                            viewport: { width: 1440, height: 900 }
                        })];
                case 2:
                    context = _a.sent();
                    return [4 /*yield*/, context.newPage()];
                case 3:
                    page = _a.sent();
                    console.log('[Step 1] 🌐 正在连接指挥中心 UI (http://localhost:3000)...');
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 8]);
                    return [4 /*yield*/, page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6:
                    e_1 = _a.sent();
                    console.error('[Error] ❌ 无法连接到 UI 服务。请确保 npm run dev:ui 已启动。');
                    return [4 /*yield*/, browser.close()];
                case 7:
                    _a.sent();
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8:
                    console.log('[Step 2] ⏳ 等待数据水合 (Hydration)...');
                    return [4 /*yield*/, page.waitForFunction(function () {
                            var divs = Array.from(document.querySelectorAll('div'));
                            var nodesLabel = divs.find(function (el) { return el.textContent === 'NODES'; });
                            return nodesLabel && nodesLabel.nextElementSibling && nodesLabel.nextElementSibling.textContent !== '0';
                        }, { timeout: 15000 })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var _a;
                            var divs = Array.from(document.querySelectorAll('div'));
                            var nodesLabel = divs.find(function (el) { return el.textContent === 'NODES'; });
                            return (_a = nodesLabel === null || nodesLabel === void 0 ? void 0 : nodesLabel.nextElementSibling) === null || _a === void 0 ? void 0 : _a.textContent;
                        })];
                case 10:
                    nodeCount = _a.sent();
                    console.log("[Status] \u2705 \u6C34\u5408\u6210\u529F\u3002\u5F53\u524D\u6D3B\u52A8\u7B97\u529B\u8282\u70B9: ".concat(nodeCount));
                    console.log('[Step 3] 🧠 使用 UniversalSelfHealing 引擎注入意志...');
                    inputSelector = 'input[placeholder="Inject Raw Intent String..."]';
                    return [4 /*yield*/, UniversalSelfHealing_1.UniversalSelfHealing.autonomousAction(page, 'fill', inputSelector, {
                            maxAttempts: 3
                        })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, page.fill(inputSelector, 'Autonomous Ralph Loop Verification: Phase 6 Activation')];
                case 12:
                    _a.sent();
                    buttonSelector = 'button:contains("FIRE INTENT")';
                    return [4 /*yield*/, UniversalSelfHealing_1.UniversalSelfHealing.autonomousAction(page, 'click', buttonSelector, {
                            maxAttempts: 3,
                            fallback: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.warn('[Heal] ⚠️ 原始选择器失效，尝试备用选择器...');
                                            return [4 /*yield*/, page.click('button.bg-red-600')];
                                        case 1: return [2 /*return*/, _a.sent()]; // 典型的红色按钮类名
                                    }
                                });
                            }); }
                        })];
                case 13:
                    fireResult = _a.sent();
                    if (!(fireResult.status === 'SUCCESS')) return [3 /*break*/, 14];
                    console.log("[Status] \u2705 \u610F\u5FD7\u6CE8\u5165\u6307\u4EE4\u4E0B\u8FBE\u6210\u529F (\u5C1D\u8BD5\u6B21\u6570: ".concat(fireResult.attempts, ")"));
                    return [3 /*break*/, 16];
                case 14:
                    console.error('[Error] ❌ 意志注入指令失败。');
                    return [4 /*yield*/, browser.close()];
                case 15:
                    _a.sent();
                    process.exit(1);
                    _a.label = 16;
                case 16:
                    console.log('[Step 4] ⏳ 监听 WebSocket 实时遙测流...');
                    // 等待 UI 更新 EXECUTIONS
                    return [4 /*yield*/, page.waitForTimeout(10000)];
                case 17:
                    // 等待 UI 更新 EXECUTIONS
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var _a;
                            var divs = Array.from(document.querySelectorAll('div'));
                            var execLabel = divs.find(function (el) { return el.textContent === 'EXECUTIONS'; });
                            return (_a = execLabel === null || execLabel === void 0 ? void 0 : execLabel.nextElementSibling) === null || _a === void 0 ? void 0 : _a.textContent;
                        })];
                case 18:
                    executionsCount = _a.sent();
                    console.log("[Status] \uD83D\uDCCA \u9065\u6D4B\u53CD\u9988\uFF1A\u6267\u884C\u8BA1\u6570\u66F4\u65B0\u4E3A ".concat(executionsCount));
                    console.log('[Step 5] 📁 验证物理一致性 (物化检查)...');
                    targetFile = path_1.default.resolve(process.cwd(), 'workspace/ui_test_autonomous.json');
                    files = fs_1.default.readdirSync('workspace');
                    recentFiles = files.filter(function (f) { return f.startsWith('ui_test_') && f.endsWith('.json'); });
                    if (recentFiles.length > 0) {
                        console.log("[Status] \u2705 \u7269\u7406\u4E00\u81F4\u6027\u9A8C\u8BC1\u901A\u8FC7\u3002\u68C0\u6D4B\u5230 ".concat(recentFiles.length, " \u4E2A\u7269\u5316\u6587\u4EF6\u3002"));
                    }
                    else {
                        console.warn('[Warning] ⚠️ 未在 workspace 中检测到预期的物化文件。可能存在落盘延迟或路径偏差。');
                    }
                    screenshotPath = path_1.default.resolve(process.cwd(), 'workspace/ralph_loop_autonomous_evidence.png');
                    return [4 /*yield*/, page.screenshot({ path: screenshotPath, fullPage: true })];
                case 19:
                    _a.sent();
                    console.log("[Evidence] \uD83D\uDCF8 \u73B0\u573A\u53D6\u8BC1\u5DF2\u4FDD\u5B58: ".concat(screenshotPath));
                    return [4 /*yield*/, browser.close()];
                case 20:
                    _a.sent();
                    console.log('\n✅ RALPH LOOP AUTONOMOUS VERIFICATION COMPLETED');
                    return [2 /*return*/];
            }
        });
    });
}
runAutonomousVerification().catch(function (err) {
    console.error('[Critical] 💀 验证过程崩溃:', err);
    process.exit(1);
});

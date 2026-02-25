"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalSelfHealing = void 0;
var UniversalSelfHealing = /** @class */ (function () {
    function UniversalSelfHealing() {
    }
    /**
     * 增强版自愈循环
     * 支持 maxAttempts、timeout 和 fallback 降级策略
     */
    UniversalSelfHealing.autonomousAction = function (page_1, action_1, selector_1) {
        return __awaiter(this, arguments, void 0, function (page, action, selector, options) {
            var _a, maxAttempts, _b, timeout, _c, fallback, attempt, error_1, context, diagnosis;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = options.maxAttempts, maxAttempts = _a === void 0 ? 3 : _a, _b = options.timeout, timeout = _b === void 0 ? 30000 : _b, _c = options.fallback, fallback = _c === void 0 ? null : _c;
                        attempt = 1;
                        _d.label = 1;
                    case 1:
                        if (!(attempt <= maxAttempts)) return [3 /*break*/, 10];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 9]);
                        return [4 /*yield*/, page[action](selector, { timeout: timeout })];
                    case 3:
                        _d.sent();
                        return [2 /*return*/, { status: 'SUCCESS', attempts: attempt }];
                    case 4:
                        error_1 = _d.sent();
                        return [4 /*yield*/, this.captureContext(page, error_1)];
                    case 5:
                        context = _d.sent();
                        return [4 /*yield*/, this.diagnose(context)];
                    case 6:
                        diagnosis = _d.sent();
                        if (diagnosis.fixed) {
                            selector = diagnosis.newSelector;
                            return [3 /*break*/, 9];
                        }
                        if (!(attempt === maxAttempts && fallback)) return [3 /*break*/, 8];
                        return [4 /*yield*/, fallback()];
                    case 7: return [2 /*return*/, _d.sent()];
                    case 8: return [3 /*break*/, 9];
                    case 9:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/, { status: 'FAILED', attempts: maxAttempts }];
                }
            });
        });
    };
    /**
     * 捕获上下文信息
     */
    UniversalSelfHealing.captureContext = function (page, error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _b = {};
                        return [4 /*yield*/, page.evaluate(function () { return document.body.innerHTML.slice(0, 5000); })];
                    case 1: return [2 /*return*/, (_b.dom = _c.sent(),
                            _b.error = (error === null || error === void 0 ? void 0 : error.message) || String(error),
                            _b.timestamp = new Date().toISOString(),
                            _b)];
                    case 2:
                        _a = _c.sent();
                        return [2 /*return*/, { error: (error === null || error === void 0 ? void 0 : error.message) || String(error), timestamp: new Date().toISOString() }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 诊断并尝试修复问题
     */
    UniversalSelfHealing.diagnose = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // 实际诊断逻辑可以在这里扩展
                return [2 /*return*/, { fixed: false }];
            });
        });
    };
    /**
     * 意志投射执行器：将任何易碎的物理动作封装在自省循环中
     */
    UniversalSelfHealing.execute = function (taskName, action, agent) {
        return __awaiter(this, void 0, void 0, function () {
            var attempts, error_2, healPlan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempts = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempts < 3)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, action()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_2 = _a.sent();
                        attempts++;
                        console.warn("[INTROSPECTION] ".concat(taskName, " \u5931\u8D25 (").concat(attempts, "/3). \u542F\u52A8\u5185\u7701..."));
                        return [4 /*yield*/, agent.diagnoseAndFix({
                                task: taskName,
                                error: error_2.message,
                                timestamp: new Date().toISOString()
                            })];
                    case 5:
                        healPlan = _a.sent();
                        if (!healPlan)
                            throw error_2;
                        console.log("[HEAL] \u5DF2\u81EA\u52A8\u5E94\u7528\u8865\u4E01\uFF0C\u6B63\u5728\u91CD\u542F\u6267\u884C\u6D41...");
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return UniversalSelfHealing;
}());
exports.UniversalSelfHealing = UniversalSelfHealing;

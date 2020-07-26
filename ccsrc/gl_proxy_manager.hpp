#pragma once

#include <nan.h>

#include <random>
#include <vector>
#include "random_generator.hpp"

namespace demo {

class GLProxyManager : public Nan::ObjectWrap
{
public:
    static NAN_MODULE_INIT(Init);

private:
    RandomGenerator rng_;

    GLProxyManager() : bufid_(-1), rng_(12345) {}
    ~GLProxyManager() = default;

    static NAN_METHOD(New);

    // static NAN_METHOD(GetValue);

    // Set manager object
    static NAN_METHOD(SetManager);

    // Initialization
    static NAN_METHOD(Create);

    // Render
    static NAN_METHOD(Render);

    // ctor ??
    static Nan::Persistent<v8::Function> constructor;

    // int bufsize_;
    // std::vector<float> buffer_;

    int bufid_;
    Nan::Persistent<v8::Object> mgr_;
 
    static inline float clamp(float min, float max, float val)
    {
        return std::min<float>(std::max<float>(min, val), max);
    }

    inline double randomUniform()
    {
        return rng_.randomUniform();
    }        

    constexpr static int VERTEX_SIZE = 3;  // vec3
    constexpr static int COLOR_SIZE = 4;   // vec4
    constexpr static int STRIDE_SIZE = VERTEX_SIZE + COLOR_SIZE;
    
    constexpr static int VERTEX_NUMS = 6 * 1000; // * 1000;
    constexpr static int TRIANGLE_NUMS = VERTEX_NUMS / 3;
    constexpr static float scl = 1.0f;

    inline void updateData(float *pbuf)
    {
        for (size_t i = 0; i < VERTEX_NUMS; ++i) {
        // for (size_t i = 0; i < VERTEX_NUMS/2; ++i) {
            const int bias = STRIDE_SIZE * i;
            pbuf[bias + 0] += randomUniform() * scl;
            pbuf[bias + 1] += randomUniform() * scl;
            pbuf[bias + 2] += randomUniform() * scl;

            pbuf[bias + 3] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 3]);
            pbuf[bias + 4] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 4]);
            pbuf[bias + 5] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 5]);
        }
    }

    float *getBuffer(int bufid);
};

}  // namespace demo
